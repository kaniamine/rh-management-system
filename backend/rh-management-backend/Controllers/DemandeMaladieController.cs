using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;

namespace rh_management_backend.Controllers;

[ApiController]
public class DemandeMaladieController : ControllerBase
{
    private readonly RhDbContext _db;

    public DemandeMaladieController(RhDbContext db)
    {
        _db = db;
    }

    [HttpPost("api/conges-maladie")]
    [HttpPost("api/demandes-maladie")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] CreateDemandeMaladieDto? dto)
    {
        if (dto == null)
            return BadRequest(new { message = "Requête invalide." });

        if (string.IsNullOrWhiteSpace(dto.Matricule))
            return BadRequest(new { message = "Le matricule est obligatoire." });

        if (string.IsNullOrWhiteSpace(dto.TypeMaladie))
            return BadRequest(new { message = "Le type de maladie est obligatoire." });

        if (string.IsNullOrWhiteSpace(dto.DateDebut) || string.IsNullOrWhiteSpace(dto.DateFin))
            return BadRequest(new { message = "Les dates de début et de fin sont obligatoires." });

        if (!DateOnly.TryParse(dto.DateDebut, out var dateDebut) ||
            !DateOnly.TryParse(dto.DateFin, out var dateFin))
            return BadRequest(new { message = "Format de date invalide (YYYY-MM-DD attendu)." });

        if (dateFin < dateDebut)
            return BadRequest(new { message = "La date de fin ne peut pas être antérieure à la date de début." });

        if (dto.CertificatMedical == null)
            return BadRequest(new { message = "Le certificat médical est obligatoire." });

        var fichierNom = dto.CertificatMedical.FileName;

        var entity = new DemandeMaladie
        {
            Matricule = dto.Matricule.Trim(),
            Direction = dto.Direction?.Trim() ?? string.Empty,
            Service = dto.Service?.Trim() ?? string.Empty,
            TypeMaladie = dto.TypeMaladie.Trim(),
            DateDebut = dateDebut,
            DateFin = dateFin,
            NombreJours = dto.NombreJours,
            Commentaire = string.IsNullOrWhiteSpace(dto.Commentaire) ? null : dto.Commentaire.Trim(),
            CertificatMedicalFichierNom = fichierNom,
            Statut = "En attente de validation RH",
            CreatedAt = DateTime.UtcNow
        };

        _db.DemandesMaladie.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id },
            new { id = entity.Id, statut = entity.Statut });
    }

    [HttpGet("api/conges-maladie")]
    [HttpGet("api/demandes-maladie")]
    public async Task<IActionResult> GetAll()
        => Ok(await _db.DemandesMaladie.AsNoTracking().ToListAsync());

    [HttpGet("api/conges-maladie/{id:int}")]
    [HttpGet("api/demandes-maladie/{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _db.DemandesMaladie.FindAsync(id);
        return d == null ? NotFound() : Ok(d);
    }
    [HttpPatch("api/conges-maladie/{id:int}/statut")]
    [HttpPatch("api/demandes-maladie/{id:int}/statut")]
    public async Task<IActionResult> UpdateStatut(int id, [FromBody] UpdateStatutDto dto)
    {
        var entity = await _db.DemandesMaladie.FindAsync(id);
        if (entity == null) return NotFound();
        entity.Statut = dto.Statut;
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, statut = entity.Statut });
    }
}

// ── DTO ──────────────────────────────────────────────────────
public sealed class CreateDemandeMaladieDto
{
    public string TypeMaladie { get; set; } = string.Empty;
    public string Matricule { get; set; } = string.Empty;
    public string? Direction { get; set; }
    public string? Service { get; set; }
    public string DateDebut { get; set; } = string.Empty;
    public string DateFin { get; set; } = string.Empty;
    public int NombreJours { get; set; }
    public string? Commentaire { get; set; }
    public IFormFile? CertificatMedical { get; set; }
}