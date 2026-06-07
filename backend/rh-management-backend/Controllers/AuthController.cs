using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.DTOs.Auth;
using rh_management_backend.Models;
using rh_management_backend.Services;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly RhDbContext _db;
    private readonly IConfiguration _config;
    private readonly IPointageService _pointage;

    public AuthController(IAuthService authService, RhDbContext db, IConfiguration config, IPointageService pointage)
    {
        _authService = authService;
        _db = db;
        _config = config;
        _pointage = pointage;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (dto == null)
            return BadRequest(new { message = "Requete invalide." });

        if (string.IsNullOrWhiteSpace(dto.Matricule) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Matricule et mot de passe obligatoires." });

        var result = await _authService.LoginAsync(dto);

        if (result == null)
            return Unauthorized(new { message = "Matricule ou mot de passe incorrect." });

        // Enregistrer automatiquement le pointage d'entrée pour les non-RH
        if (result.Role != "rh" && result.Role != "admin")
        {
            try { await _pointage.PointerEntreeAsync(result.Matricule); }
            catch (InvalidOperationException) { /* pointage déjà enregistré aujourd'hui */ }
            catch (Exception ex) { Console.WriteLine($"[POINTAGE-AUTO] {ex.Message}"); }
        }

        return Ok(result);
    }

    [HttpPost("change-password")]
    [Authorize(Roles = "employe,n1,dg,rh")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        try
        {
            var matricule = User.FindFirstValue("matricule");
            if (string.IsNullOrEmpty(matricule))
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
                return BadRequest(new { message = "Mot de passe actuel et nouveau mot de passe obligatoires." });

            var (ok, error) = await _authService.ChangePasswordAsync(matricule, dto);
            if (!ok)
                return BadRequest(new { message = error });

            return Ok(new { message = "Mot de passe modifié avec succès." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CHANGE-PWD ERROR] {ex.Message}");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// POST /api/auth/reset-password  (RH resets an employee's password)
    [HttpPost("reset-password")]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordDto dto,
        [FromServices] RhDbContext db)
    {
        var matricule = dto.Matricule.ToUpper();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Matricule == matricule && u.IsActive);

        if (user == null)
            return NotFound(new { message = "Utilisateur introuvable." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword("0000");
        user.MustChangePassword = true;

        db.Notifications.Add(new Notification
        {
            DestinataireMatricule = matricule,
            Message = "Votre mot de passe a été réinitialisé par le service RH. Veuillez vous connecter avec le mot de passe temporaire : 0000",
            Timestamp = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
        return Ok(new { message = $"Mot de passe de {matricule} réinitialisé avec succès." });
    }

    /// POST /api/auth/admin-reset-password  (rh override — can reset any active user)
    [HttpPost("admin-reset-password")]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> AdminResetPassword(
        [FromBody] ResetPasswordDto dto,
        [FromServices] RhDbContext db)
    {
        var matricule = dto.Matricule.ToUpper();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Matricule == matricule && u.IsActive);

        if (user == null)
            return NotFound(new { message = "Utilisateur introuvable." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword("0000");
        user.MustChangePassword = true;

        db.Notifications.Add(new Notification
        {
            DestinataireMatricule = matricule,
            Message = "Votre mot de passe a été réinitialisé par l'administrateur. Veuillez vous connecter avec le mot de passe temporaire : 0000",
            Timestamp = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
        return Ok(new { message = $"Mot de passe de {matricule} réinitialisé avec succès." });
    }

    /// POST /api/auth/valider-cle-admin
    [HttpPost("valider-cle-admin")]
    [Authorize(Roles = "rh")]
    public IActionResult ValiderCleAdmin([FromBody] ValiderCleAdminDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto?.Cle))
            return BadRequest(new { error = "Clé d'accès requise." });

        var cleAttendue = _config["Admin:CleAcces"];
        if (string.IsNullOrEmpty(cleAttendue) || dto.Cle != cleAttendue)
            return BadRequest(new { error = "Clé d'accès incorrecte. Accès refusé." });

        return Ok(new { adminValide = true });
    }

    // GET /api/auth/check-matricule?matricule=EMP001
    [HttpGet("check-matricule")]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> CheckMatricule(
        [FromQuery] string matricule,
        [FromServices] RhDbContext db)
    {
        if (string.IsNullOrWhiteSpace(matricule))
            return BadRequest(new { message = "Matricule requis." });

        var exists = await db.Users.AnyAsync(u => u.Matricule == matricule.ToUpper() && u.IsActive);
        return Ok(new { exists });
    }
}
