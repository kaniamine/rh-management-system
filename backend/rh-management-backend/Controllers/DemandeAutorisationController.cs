using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;
using System.Text.RegularExpressions;

namespace rh_management_backend.Controllers;

[ApiController]
public class DemandeAutorisationController : ControllerBase
{
    private readonly RhDbContext _db;

    public DemandeAutorisationController(RhDbContext db)
    {
        _db = db;
    }

    [HttpPost("api/autorisations-sortie")]
    [HttpPost("api/DemandeAutorisation")]
    [HttpPost("api/demandes-autorisation")]
    [HttpPost("api/conge/demande-autorisation")]
    public async Task<IActionResult> Create([FromBody] CreateDemandeAutorisationDto? dto)
    {
        if (dto == null)
            return BadRequest(new { message = "Requête invalide." });

        if (string.IsNullOrWhiteSpace(dto.Matricule))
            return BadRequest(new { message = "Le matricule est obligatoire." });

        var typeAutorisation = dto.Type ?? dto.TypeAutorisation;
        if (string.IsNullOrWhiteSpace(typeAutorisation))
            return BadRequest(new { message = "Le type d'autorisation est obligatoire." });

        var dateStr = dto.Date ?? dto.DateDemande;
        if (string.IsNullOrWhiteSpace(dateStr))
            return BadRequest(new { message = "La date de la demande est obligatoire." });

        var heureDepartStr = dto.HeureDepart ?? dto.HeureSortie;
        var heureRetourStr = dto.HeureRetour;

        if (!string.IsNullOrWhiteSpace(dto.Telephone))
        {
            var tel = Regex.Replace(dto.Telephone.Trim(), @"[\s\-\.]", "");
            if (!Regex.IsMatch(tel, @"^\+?[0-9]{8,15}$"))
                return BadRequest(new { message = "Numéro de téléphone invalide (8 à 15 chiffres, + accepté)." });
        }

        if (!dto.EstBrouillon)
        {
            if (string.IsNullOrWhiteSpace(dto.Motif))
                return BadRequest(new { message = "Le motif est obligatoire." });

            if (string.IsNullOrWhiteSpace(heureDepartStr) || string.IsNullOrWhiteSpace(heureRetourStr))
                return BadRequest(new { message = "L'heure de début et l'heure de fin sont obligatoires." });

            if (!TimeOnly.TryParse(heureDepartStr, out var hDebut) ||
                !TimeOnly.TryParse(heureRetourStr, out var hFin))
                return BadRequest(new { message = "Format d'heure invalide (HH:mm attendu)." });

            if (hFin <= hDebut)
                return BadRequest(new { message = "L'heure de fin doit être après l'heure de début." });

            var debutMin = new TimeOnly(8, 0);
            var debutMax = new TimeOnly(17, 20);

            if (hDebut < debutMin || hDebut >= debutMax)
                return BadRequest(new { message = "L'heure de début est hors des plages autorisées (08h00 – 17h20)." });

            if (hFin > debutMax)
                return BadRequest(new { message = "L'heure de fin ne peut pas dépasser 17h20." });

            if (typeAutorisation.Contains("personnel", StringComparison.OrdinalIgnoreCase))
            {
                var duree = CalculerDureeMinutes(hDebut, hFin);
                if (duree > 90)
                    return BadRequest(new
                    {
                        message = $"Durée calculée : {duree} min. La durée maximale pour une autorisation personnelle est de 1h30 (90 min). La pause déjeuner 12h00–13h00 est exclue du calcul."
                    });
            }
        }

        var statut = dto.EstBrouillon
            ? "Brouillon"
            : "En attente de validation du supérieur hiérarchique";

        DateOnly.TryParse(dateStr, out var dateDemande);
        TimeOnly.TryParse(heureDepartStr ?? "", out var heureSortie);
        TimeOnly.TryParse(heureRetourStr ?? "", out var heureRetour);

        var entity = new DemandeAutorisation
        {
            NomComplet = (dto.NomComplet ?? string.Empty).Trim(),
            Matricule = dto.Matricule.Trim(),
            GradeFonction = string.IsNullOrWhiteSpace(dto.GradeFonction) ? null : dto.GradeFonction.Trim(),
            TypeAutorisation = typeAutorisation.Trim(),
            DateDemande = dateDemande,
            HeureSortie = dto.EstBrouillon ? null : heureSortie,
            HeureRetour = dto.EstBrouillon ? null : heureRetour,
            Motif = string.IsNullOrWhiteSpace(dto.Motif) ? null : dto.Motif.Trim(),
            Destination = string.IsNullOrWhiteSpace(dto.Destination) ? null : dto.Destination.Trim(),
            Telephone = string.IsNullOrWhiteSpace(dto.Telephone) ? null : dto.Telephone.Trim(),
            Statut = statut,
            CreatedAt = DateTime.UtcNow
        };

        _db.DemandesAutorisations.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id },
            new { id = entity.Id, statut = entity.Statut });
    }

    [HttpGet("api/autorisations-sortie")]
    [HttpGet("api/DemandeAutorisation")]
    [HttpGet("api/demandes-autorisation")]
    [HttpGet("api/conge/demande-autorisation")]
    public async Task<IActionResult> GetAll()
        => Ok(await _db.DemandesAutorisations.AsNoTracking().ToListAsync());

    [HttpGet("api/autorisations-sortie/{id:int}")]
    [HttpGet("api/DemandeAutorisation/{id:int}")]
    [HttpGet("api/demandes-autorisation/{id:int}")]
    [HttpGet("api/conge/demande-autorisation/{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _db.DemandesAutorisations.FindAsync(id);
        return d == null ? NotFound() : Ok(d);
    }

    private static double CalculerDureeMinutes(TimeOnly debut, TimeOnly fin)
    {
        double total = (fin - debut).TotalMinutes;
        if (total <= 0) return 0;

        var pauseD = new TimeOnly(12, 0);
        var pauseF = new TimeOnly(13, 0);
        var overlapD = debut > pauseD ? debut : pauseD;
        var overlapF = fin < pauseF ? fin : pauseF;

        if (overlapF > overlapD)
            total -= (overlapF - overlapD).TotalMinutes;

        return Math.Round(Math.Max(0, total), 1);
    }
    [HttpPatch("api/autorisations-sortie/{id:int}/statut")]
    [HttpPatch("api/demandes-autorisation/{id:int}/statut")]
    public async Task<IActionResult> UpdateStatut(int id, [FromBody] UpdateStatutDto dto)
    {
        var entity = await _db.DemandesAutorisations.FindAsync(id);
        if (entity == null) return NotFound();
        entity.Statut = dto.Statut;
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, statut = entity.Statut });
    }
}

// ── DTO ──────────────────────────────────────────────────────
public sealed class CreateDemandeAutorisationDto
{
    public string? Type { get; set; }
    public string? TypeAutorisation { get; set; }
    public string Matricule { get; set; } = string.Empty;
    public string? NomComplet { get; set; }
    public string? GradeFonction { get; set; }
    public string? Direction { get; set; }
    public string? Service { get; set; }
    public string? SuperieurHierarchique { get; set; }
    public string? Date { get; set; }
    public string? DateDemande { get; set; }
    public string? HeureDepart { get; set; }
    public string? HeureSortie { get; set; }
    public string? HeureRetour { get; set; }
    public string? Duree { get; set; }
    public string? Motif { get; set; }
    public string? Commentaire { get; set; }
    public string? Destination { get; set; }
    public string? Telephone { get; set; }
    public bool EstBrouillon { get; set; }
}
public sealed class UpdateStatutDto
{
    public string Statut { get; set; } = string.Empty;
    public string? Motif { get; set; }
}