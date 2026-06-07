using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/utilisateurs")]
[Authorize(Roles = "rh")]
public class UtilisateursController : ControllerBase
{
    private readonly RhDbContext _db;
    public UtilisateursController(RhDbContext db) => _db = db;

    // POST /api/utilisateurs/creer-rh
    [HttpPost("creer-rh")]
    public async Task<IActionResult> CreerCompteRh([FromBody] CreerRhDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Matricule) ||
            string.IsNullOrWhiteSpace(dto.Nom)       ||
            string.IsNullOrWhiteSpace(dto.Prenom)    ||
            string.IsNullOrWhiteSpace(dto.MotDePasse))
            return BadRequest(new { error = "Matricule, nom, prénom et mot de passe sont obligatoires." });

        var matricule = dto.Matricule.ToUpper().Trim();

        var existe = await _db.Users.AnyAsync(u => u.Matricule == matricule);
        if (existe)
            return Conflict(new { error = $"Un utilisateur avec le matricule {matricule} existe déjà." });

        var employe = new Employe
        {
            Matricule  = matricule,
            Nom        = dto.Nom.Trim(),
            Prenom     = dto.Prenom.Trim(),
            NomComplet = $"{dto.Prenom.Trim()} {dto.Nom.Trim()}",
            Direction  = dto.Direction?.Trim() ?? "Direction des Ressources Humaines",
            Service    = dto.Service?.Trim(),
            Fonction   = dto.Fonction?.Trim(),
            IsActive   = true,
            CreatedAt  = DateTime.UtcNow
        };
        _db.Employes.Add(employe);
        await _db.SaveChangesAsync();

        var user = new User
        {
            Matricule          = matricule,
            PasswordHash       = BCrypt.Net.BCrypt.HashPassword(dto.MotDePasse),
            Role               = "rh",
            EmployeId          = employe.Id,
            IsActive           = true,
            MustChangePassword = false,
            CreatedAt          = DateTime.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message  = $"Compte RH créé pour {employe.Prenom} {employe.Nom} ({matricule}).",
            matricule
        });
    }

    // PUT /api/utilisateurs/mon-telephone
    [HttpPut("mon-telephone")]
    [Authorize]
    public async Task<IActionResult> ChangerMonTelephone([FromBody] ChangerTelephoneDto dto)
    {
        try
        {
            if (string.IsNullOrEmpty(dto.Telephone))
                return BadRequest(new { error = "Le numéro de téléphone est obligatoire." });

            var telNettoye = NettoyerTel(dto.Telephone);

            if (!System.Text.RegularExpressions.Regex.IsMatch(telNettoye, @"^\d{8}$"))
                return BadRequest(new { error = "Format invalide. Entrez un numéro tunisien à 8 chiffres." });

            var matricule = User.FindFirstValue("matricule");
            if (string.IsNullOrEmpty(matricule))
                return Unauthorized();

            var user = await _db.Users
                .Include(u => u.Employe)
                .FirstOrDefaultAsync(u => u.Matricule == matricule);

            if (user == null)
                return NotFound(new { error = "Utilisateur introuvable." });

            user.Employe.Telephone = telNettoye;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Numéro de téléphone mis à jour avec succès." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Une erreur est survenue." });
        }
    }

    private static string NettoyerTel(string t)
    {
        t = t.Replace(" ", "").Replace("-", "").Replace(".", "");
        if (t.StartsWith("+216"))
            t = t.Substring(4);
        else if (t.StartsWith("00216"))
            t = t.Substring(5);
        else if (t.StartsWith("216"))
            t = t.Substring(3);
        return t.Trim();
    }
}

public class ChangerTelephoneDto
{
    public string Telephone { get; set; } = "";
}

public class CreerRhDto
{
    public string  Matricule  { get; set; } = string.Empty;
    public string  Nom        { get; set; } = string.Empty;
    public string  Prenom     { get; set; } = string.Empty;
    public string  MotDePasse { get; set; } = string.Empty;
    public string? Direction  { get; set; }
    public string? Service    { get; set; }
    public string? Fonction   { get; set; }
    public string? Email      { get; set; }
    public string? Telephone  { get; set; }
    public string? Role       { get; set; }
}
