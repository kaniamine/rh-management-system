using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;
using rh_management_backend.Services;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/auth")]
public class PasswordResetController : ControllerBase
{
    private readonly RhDbContext _db;
    private readonly ISmsService _sms;

    public PasswordResetController(RhDbContext db, ISmsService sms)
    {
        _db  = db;
        _sms = sms;
    }

    /// POST /api/auth/mot-de-passe-oublie — self-service, sends SMS immediately
    [HttpPost("mot-de-passe-oublie")]
    [AllowAnonymous]
    public async Task<IActionResult> MotDePasseOublie([FromBody] MotDePasseOublieDto dto)
    {
        try
        {
            var matricule = dto.Matricule.Trim().ToUpper();
            var telephone = dto.Telephone?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(telephone))
                return BadRequest(new { error = "Numéro de téléphone requis." });

            var user = await _db.Users
                .Include(u => u.Employe)
                .FirstOrDefaultAsync(u => u.Matricule == matricule && u.IsActive);

            if (user == null)
                return NotFound(new { error = "Matricule introuvable. Veuillez contacter la Direction RH." });

            var tempPassword = GenerateTempPassword();
            user.PasswordHash       = BCrypt.Net.BCrypt.HashPassword(tempPassword, 10);
            user.MustChangePassword = true;

            // Store matricule AND telephone in message so RH can resend if needed
            _db.Notifications.Add(new Notification
            {
                DestinataireMatricule = "RH001",
                Message = $"RESET|{matricule}|{telephone}",
                Timestamp = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();

            var prenom = user.Employe?.Prenom ?? matricule;
            await _sms.SendAsync(telephone,
                $"Bonjour {prenom}, votre mot de passe Al Baraka RH a ete reinitialise. " +
                $"Mot de passe temporaire : {tempPassword}. Changez-le des votre premiere connexion.");

            return Ok(new { message = $"Un mot de passe temporaire a été envoyé par SMS au numéro {telephone}." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RESET ERROR] {ex.Message}");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// POST /api/auth/reinitialiser-mot-de-passe — RH validates and sends custom password via SMS
    [HttpPost("reinitialiser-mot-de-passe")]
    [Authorize(Roles = "rh,admin")]
    public async Task<IActionResult> ReinitialiserMotDePasse([FromBody] ReinitialiserDto dto)
    {
        Console.WriteLine($"[RESET] Body received: demandeId={dto.DemandeId} pwd={dto.NouveauMotDePasse?.Length} chars");
        try
        {
            // Find the reset notification by ID
            var notif = await _db.Notifications.FindAsync(dto.DemandeId);
            if (notif == null)
                return NotFound(new { message = "Demande introuvable." });

            // Parse "RESET|MATRICULE|TELEPHONE" stored by MotDePasseOublie
            var parts     = notif.Message.Split('|');
            var matricule = parts.Length > 1 ? parts[1].Trim() : string.Empty;
            var telephone = parts.Length > 2 ? parts[2].Trim() : string.Empty;

            // Fallback: legacy message format "... : EMP001 ..."
            if (string.IsNullOrEmpty(matricule) && notif.Message.Contains(':'))
                matricule = notif.Message.Split(':').Last().Trim().Split(' ')[0];

            if (string.IsNullOrEmpty(matricule))
                return BadRequest(new { message = "Impossible d'extraire le matricule de la demande." });

            var user = await _db.Users
                .Include(u => u.Employe)
                .FirstOrDefaultAsync(u => u.Matricule == matricule && u.IsActive);

            if (user == null)
                return NotFound(new { message = $"Utilisateur {matricule} introuvable." });

            // Set the RH-chosen password
            var newPwd = dto.NouveauMotDePasse?.Trim();
            if (string.IsNullOrWhiteSpace(newPwd))
                return BadRequest(new { message = "Le nouveau mot de passe est requis." });

            user.PasswordHash       = BCrypt.Net.BCrypt.HashPassword(newPwd, 10);
            user.MustChangePassword = true;

            // Notify the employee
            _db.Notifications.Add(new Notification
            {
                DestinataireMatricule = matricule,
                Message = $"Votre mot de passe a été réinitialisé par la RH. Mot de passe temporaire : {newPwd}",
                Timestamp = DateTime.UtcNow
            });

            // Remove the handled reset request
            _db.Notifications.Remove(notif);
            await _db.SaveChangesAsync();

            // Send SMS if we have a telephone number
            if (!string.IsNullOrWhiteSpace(telephone))
            {
                var prenom = user.Employe?.Prenom ?? matricule;
                await _sms.SendAsync(telephone,
                    $"Bonjour {prenom}, la RH a reinitialise votre mot de passe Al Baraka. " +
                    $"Mot de passe temporaire : {newPwd}. Changez-le des votre premiere connexion.");
                Console.WriteLine($"[RESET] SMS sent to {telephone} for {matricule}");
            }
            else
            {
                Console.WriteLine($"[RESET] No telephone for {matricule} — SMS skipped");
            }

            return Ok(new { message = $"Mot de passe de {matricule} réinitialisé avec succès." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RESET ERROR] {ex.Message}");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// GET /api/auth/demandes-reinitialisation — RH lists pending reset requests
    [HttpGet("demandes-reinitialisation")]
    [Authorize(Roles = "rh,admin")]
    public async Task<IActionResult> GetDemandesReinitialisation()
    {
        var rows = await _db.Notifications
            .Where(n => n.DestinataireMatricule == "RH001" &&
                        (n.Message.StartsWith("RESET|") ||
                         n.Message.Contains("Réinitialisation mot de passe")))
            .OrderByDescending(n => n.Timestamp)
            .Select(n => new { n.Id, n.Message, n.Timestamp })
            .ToListAsync();

        var result = rows.Select(n =>
        {
            // New format: "RESET|EMP001|+21658723367"
            if (n.Message.StartsWith("RESET|"))
            {
                var p = n.Message.Split('|');
                return new
                {
                    n.Id,
                    n.Message,
                    n.Timestamp,
                    matricule = p.Length > 1 ? p[1] : string.Empty,
                    telephone = p.Length > 2 ? p[2] : string.Empty
                };
            }
            // Legacy format: "... : EMP001 ..."
            var matriculeLegacy = n.Message.Contains(':')
                ? n.Message.Split(':').Last().Trim().Split(' ')[0]
                : string.Empty;
            return new
            {
                n.Id,
                n.Message,
                n.Timestamp,
                matricule = matriculeLegacy,
                telephone = string.Empty
            };
        }).ToList();

        return Ok(result);
    }

    private static string GenerateTempPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var bytes = new byte[8];
        RandomNumberGenerator.Fill(bytes);
        return new string(bytes.Select(b => chars[b % chars.Length]).ToArray());
    }
}

public record MotDePasseOublieDto([Required] string Matricule, [Required] string Telephone);
public record ReinitialiserDto(int DemandeId, [Required] string NouveauMotDePasse);
