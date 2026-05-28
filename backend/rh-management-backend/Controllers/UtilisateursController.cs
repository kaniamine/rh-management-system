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
