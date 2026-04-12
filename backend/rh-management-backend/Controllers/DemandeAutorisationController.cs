using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;
using System.Text.RegularExpressions;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/conge/demande-autorisation")]
public class DemandeAutorisationController : ControllerBase
{
    private readonly RhDbContext _db;

    public DemandeAutorisationController(RhDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDemandeAutorisationDto? dto)
    {
        if (dto == null)
            return BadRequest(new { message = "Requête invalide." });

        // Champs obligatoires
        if (string.IsNullOrWhiteSpace(dto.NomComplet))
            return BadRequest(new { message = "Le nom complet est obligatoire." });

        if (string.IsNullOrWhiteSpace(dto.Matricule))
            return BadRequest(new { message = "Le matricule est obligatoire." });

        if (string.IsNullOrWhiteSpace(dto.TypeAutorisation))
            return BadRequest(new { message = "Le type d'autorisation est obligatoire." });

        if (dto.DateDemande == default)
            return BadRequest(new { message = "La date de la demande est obligatoire ya m3alem." });

        // Validation téléphone (si renseigné)
        if (!string.IsNullOrWhiteSpace(dto.Telephone))
        {
            var tel = Regex.Replace(dto.Telephone.Trim(), @"[\s\-\.]", "");
            if (!Regex.IsMatch(tel, @"^\+?[0-9]{8,15}$"))
                return BadRequest(new { message = "Numéro de téléphone invalide (8 à 15 chiffres, + accepté)." });
        }

        // Validations soumission seulement
        if (!dto.EstBrouillon)
        {
            if (string.IsNullOrWhiteSpace(dto.Motif))
                return BadRequest(new { message = "Le motif est obligatoire." });

            if (dto.HeureSortie == null || dto.HeureRetour == null)
                return BadRequest(new { message = "L'heure de début et l'heure de fin sont obligatoires." });

            if (dto.HeureRetour <= dto.HeureSortie)
                return BadRequest(new { message = "L'heure de fin doit être après l'heure de début." });

            var debutMin = new TimeOnly(8, 0);
            var debutMax = new TimeOnly(17, 20);

            if (dto.HeureSortie < debutMin || dto.HeureSortie >= debutMax)
                return BadRequest(new { message = "L'heure de début est hors des plages autorisées (08h00 – 17h20)." });

            if (dto.HeureRetour > debutMax)
                return BadRequest(new { message = "L'heure de fin ne peut pas dépasser 17h20." });

            // Durée max 90 min pour autorisation personnelle
            if (dto.TypeAutorisation.Contains("personnel", StringComparison.OrdinalIgnoreCase))
            {
                var duree = CalculerDureeMinutes(dto.HeureSortie.Value, dto.HeureRetour.Value);
                if (duree > 90)
                    return BadRequest(new
                    {
                        message = $"Durée calculée : {duree} min. La durée maximale pour une autorisation personnelle est de 1h30 (90 min). La pause déjeuner 12h00–13h00 est exclue du calcul."
                    });
            }
        }

        var statut = dto.EstBrouillon ? "Brouillon" : "En attente";

        var entity = new DemandeAutorisation
        {
            NomComplet = dto.NomComplet.Trim(),
            Matricule = dto.Matricule.Trim(),
            GradeFonction = string.IsNullOrWhiteSpace(dto.GradeFonction) ? null : dto.GradeFonction.Trim(),
            TypeAutorisation = dto.TypeAutorisation.Trim(),
            DateDemande = dto.DateDemande,
            HeureSortie = dto.HeureSortie,
            HeureRetour = dto.HeureRetour,
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

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _db.DemandesAutorisations.AsNoTracking().ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _db.DemandesAutorisations.FindAsync(id);
        return d == null ? NotFound() : Ok(d);
    }

    // Calcul durée en minutes — pause 12h-13h exclue
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
}

// ── DTO ───────────────────────────────────────────────────────
public sealed class CreateDemandeAutorisationDto
{
    public string NomComplet { get; set; } = string.Empty;
    public string Matricule { get; set; } = string.Empty;
    public string? GradeFonction { get; set; }
    public string TypeAutorisation { get; set; } = string.Empty;
    public DateOnly DateDemande { get; set; }
    public TimeOnly? HeureSortie { get; set; }
    public TimeOnly? HeureRetour { get; set; }
    public string? Motif { get; set; }
    public string? Destination { get; set; }
    public string? Telephone { get; set; }
    public bool EstBrouillon { get; set; }
}