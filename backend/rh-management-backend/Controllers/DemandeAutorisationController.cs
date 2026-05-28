using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;
using rh_management_backend.Services;
using System.Text.RegularExpressions;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/demandes-autorisation")]
[Authorize]
public class DemandeAutorisationController : ControllerBase
{
    private readonly RhDbContext _db;
    private readonly INotificationService _notif;

    public DemandeAutorisationController(RhDbContext db, INotificationService notif)
    {
        _db    = db;
        _notif = notif;
    }

    // GET /api/demandes-autorisation?matricule=...&statut=...
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? matricule,
        [FromQuery] string? statut)
    {
        var q = _db.DemandesAutorisations.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(matricule)) q = q.Where(d => d.Matricule == matricule.Trim());
        if (!string.IsNullOrWhiteSpace(statut))    q = q.Where(d => d.Statut    == statut.Trim());
        return Ok(await q.OrderByDescending(d => d.CreatedAt).ToListAsync());
    }

    // GET /api/demandes-autorisation/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _db.DemandesAutorisations.FindAsync(id);
        return d == null ? NotFound() : Ok(d);
    }

    // POST /api/demandes-autorisation — Créer / brouillon (Employé)
    [HttpPost]
    [Authorize(Roles = "employe,n1")]
    public async Task<IActionResult> Create([FromBody] CreateDemandeAutorisationDto? dto)
    {
        if (dto == null)
            return BadRequest(new { message = "Requête invalide." });

        if (string.IsNullOrWhiteSpace(dto.Matricule))
            return BadRequest(new { message = "Le matricule est obligatoire." });

        if (string.IsNullOrWhiteSpace(dto.TypeAutorisation))
            return BadRequest(new { message = "Le type d'autorisation est obligatoire." });

        if (dto.DateDemande == default)
            return BadRequest(new { message = "La date de la demande est obligatoire." });

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

            if (!dto.HeureSortie.HasValue || !dto.HeureRetour.HasValue)
                return BadRequest(new { message = "L'heure de début et l'heure de fin sont obligatoires." });

            var hDebut = dto.HeureSortie.Value;
            var hFin   = dto.HeureRetour.Value;

            if (hFin <= hDebut)
                return BadRequest(new { message = "L'heure de fin doit être après l'heure de début." });

            var debutMin = new TimeOnly(8, 0);
            var debutMax = new TimeOnly(17, 20);

            if (hDebut < debutMin || hDebut >= debutMax)
                return BadRequest(new { message = "L'heure de début est hors des plages autorisées (08h00 – 17h20)." });

            if (hFin > debutMax)
                return BadRequest(new { message = "L'heure de fin ne peut pas dépasser 17h20." });

            if (dto.TypeAutorisation.Contains("personnel", StringComparison.OrdinalIgnoreCase))
            {
                var duree = CalculerDureeMinutes(hDebut, hFin);
                if (duree > 90)
                    return BadRequest(new
                    {
                        message = $"Durée calculée : {duree} min. La durée maximale pour une autorisation personnelle est de 1h30 (90 min)."
                    });
            }
        }

        var employe = await _db.Employes.FirstOrDefaultAsync(e => e.Matricule == dto.Matricule.Trim());

        var entity = new DemandeAutorisation
        {
            NomComplet            = employe?.NomComplet ?? dto.Matricule.Trim(),
            Matricule             = dto.Matricule.Trim(),
            Direction             = employe?.Direction ?? "",
            Service               = employe?.Service   ?? "",
            GradeFonction         = string.IsNullOrWhiteSpace(dto.GradeFonction) ? null : dto.GradeFonction.Trim(),
            SuperieurHierarchique = employe?.SuperieurHierarchique ?? "",
            TypeAutorisation      = dto.TypeAutorisation.Trim(),
            DateDemande           = dto.DateDemande,
            HeureSortie           = dto.HeureSortie,
            HeureRetour           = dto.HeureRetour,
            DureeMinutes          = dto.HeureSortie.HasValue && dto.HeureRetour.HasValue
                                     ? (int)CalculerDureeMinutes(dto.HeureSortie.Value, dto.HeureRetour.Value)
                                     : null,
            Motif                 = string.IsNullOrWhiteSpace(dto.Motif) ? string.Empty : dto.Motif.Trim(),
            Destination           = string.IsNullOrWhiteSpace(dto.Destination) ? null : dto.Destination.Trim(),
            Telephone             = string.IsNullOrWhiteSpace(dto.Telephone) ? null : dto.Telephone.Trim(),
            Statut                = dto.EstBrouillon
                                     ? "Brouillon"
                                     : "En attente de validation du supérieur hiérarchique",
            CreatedAt             = DateTime.UtcNow
        };

        _db.DemandesAutorisations.Add(entity);
        await _db.SaveChangesAsync();

        // Notification soumission → N+1
        if (!dto.EstBrouillon && employe?.SuperieurHierarchiqueMatricule != null)
        {
            await _notif.CreerNotificationAsync(
                employe.SuperieurHierarchiqueMatricule,
                "n1", "autorisation", entity.Id, "soumission",
                $"Une nouvelle demande d'autorisation de {entity.NomComplet} est en attente de votre validation.");
        }

        return CreatedAtAction(nameof(GetById), new { id = entity.Id },
            new { id = entity.Id, statut = entity.Statut });
    }

    // POST /api/demandes-autorisation/{id}/valider-n1
    [HttpPost("{id}/valider-n1")]
    [Authorize(Roles = "n1")]
    public async Task<IActionResult> ValiderN1(int id, [FromBody] AutorisationActionDto dto)
    {
        var d = await _db.DemandesAutorisations.FindAsync(id);
        if (d == null) return NotFound();
        if (d.Statut != "En attente de validation du supérieur hiérarchique")
            return BadRequest(new { message = $"Statut incorrect : {d.Statut}" });

        d.Statut    = "Validée";
        d.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _notif.CreerNotificationAsync(
            d.Matricule, "employe", "autorisation", id, "validation",
            $"Votre demande d'autorisation du {d.DateDemande:dd/MM/yyyy} a été validée par votre supérieur hiérarchique.");

        await _notif.NotifierRoleAsync("rh", "autorisation", id, "validation",
            $"La demande d'autorisation de {d.NomComplet} du {d.DateDemande:dd/MM/yyyy} a été validée. À prendre en compte pour le suivi mensuel.");

        return Ok(new { statut = d.Statut });
    }

    // POST /api/demandes-autorisation/{id}/rejeter-n1
    [HttpPost("{id}/rejeter-n1")]
    [Authorize(Roles = "n1")]
    public async Task<IActionResult> RejeterN1(int id, [FromBody] AutorisationActionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Commentaire))
            return BadRequest(new { message = "Le motif de rejet est obligatoire." });

        var d = await _db.DemandesAutorisations.FindAsync(id);
        if (d == null) return NotFound();
        if (d.Statut != "En attente de validation du supérieur hiérarchique")
            return BadRequest(new { message = $"Statut incorrect : {d.Statut}" });

        d.Statut    = "Rejetée";
        d.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _notif.CreerNotificationAsync(
            d.Matricule, "employe", "autorisation", id, "rejet",
            $"Votre demande d'autorisation du {d.DateDemande:dd/MM/yyyy} a été rejetée par votre supérieur hiérarchique. Motif : {dto.Commentaire}");

        return Ok(new { statut = d.Statut });
    }

    // POST /api/demandes-autorisation/{id}/annuler
    [HttpPost("{id}/annuler")]
    public async Task<IActionResult> Annuler(int id, [FromBody] AutorisationActionDto dto)
    {
        var d = await _db.DemandesAutorisations.FindAsync(id);
        if (d == null) return NotFound();

        var annulables = new[] { "Brouillon", "En attente de validation du supérieur hiérarchique" };
        if (!annulables.Contains(d.Statut))
            return BadRequest(new { message = $"Impossible d'annuler une demande au statut : {d.Statut}" });

        var employe = await _db.Employes.FirstOrDefaultAsync(e => e.Matricule == d.Matricule);

        d.Statut    = "Annulée";
        d.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (employe?.SuperieurHierarchiqueMatricule != null)
        {
            await _notif.CreerNotificationAsync(
                employe.SuperieurHierarchiqueMatricule,
                "n1", "autorisation", id, "annulation",
                $"La demande d'autorisation de {d.NomComplet} du {d.DateDemande:dd/MM/yyyy} a été annulée.");
        }

        return Ok(new { statut = d.Statut });
    }

    private static double CalculerDureeMinutes(TimeOnly debut, TimeOnly fin)
    {
        double total = (fin - debut).TotalMinutes;
        if (total <= 0) return 0;

        var pauseD   = new TimeOnly(12, 0);
        var pauseF   = new TimeOnly(13, 0);
        var overlapD = debut > pauseD ? debut : pauseD;
        var overlapF = fin   < pauseF ? fin   : pauseF;

        if (overlapF > overlapD)
            total -= (overlapF - overlapD).TotalMinutes;

        return Math.Round(Math.Max(0, total), 1);
    }
}

// ── DTOs ───────────────────────────────────────────────────────────────────────

public sealed class CreateDemandeAutorisationDto
{
    public string   Matricule        { get; set; } = string.Empty;
    public string?  GradeFonction    { get; set; }
    public string   TypeAutorisation { get; set; } = string.Empty;
    public DateOnly DateDemande      { get; set; }
    public TimeOnly? HeureSortie     { get; set; }
    public TimeOnly? HeureRetour     { get; set; }
    public string?  Motif            { get; set; }
    public string?  Destination      { get; set; }
    public string?  Telephone        { get; set; }
    public string?  Commentaire      { get; set; }
    public bool     EstBrouillon     { get; set; }
}

public record AutorisationActionDto(
    string AuteurMatricule,
    string? Commentaire
);
