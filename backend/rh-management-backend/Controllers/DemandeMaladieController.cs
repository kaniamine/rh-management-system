using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/demandes-maladie")]
[Authorize]
public class DemandeMaladieController : ControllerBase
{
    private readonly RhDbContext _db;
    public DemandeMaladieController(RhDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? matricule,
        [FromQuery] string? statut)
    {
        var q = _db.DemandesMaladie.AsQueryable();
        if (!string.IsNullOrEmpty(matricule)) q = q.Where(d => d.Matricule == matricule);
        if (!string.IsNullOrEmpty(statut)) q = q.Where(d => d.Statut == statut);
        return Ok(await q.OrderByDescending(d => d.CreatedAt).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _db.DemandesMaladie.FindAsync(id);
        return d == null ? NotFound() : Ok(d);
    }

    [HttpPost]
    [Authorize(Roles = "employe,n1")]
    public async Task<IActionResult> Create([FromBody] CreateMaladieDto dto)
    {
        var employe = await _db.Employes
            .FirstOrDefaultAsync(e => e.Matricule == dto.Matricule);
        if (employe == null)
            return BadRequest(new { message = "Employé introuvable." });

        if (!dto.EstBrouillon &&
            string.IsNullOrWhiteSpace(dto.CertificatMedicalFichierNom))
            return BadRequest(new { message = "Le certificat médical est obligatoire." });

        int nbJours = dto.DateFin.DayNumber - dto.DateDebut.DayNumber + 1;
        bool exempte = dto.TypeMaladie is "Congé maternité" or "Congé pour chirurgie";

        var entity = new DemandeMaladie
        {
            Matricule = employe.Matricule,
            NomComplet = employe.NomComplet,
            Direction = employe.Direction,
            Service = employe.Service,
            TypeMaladie = dto.TypeMaladie,
            DateDebut = dto.DateDebut,
            DateFin = dto.DateFin,
            NombreJours = nbJours,
            ExempteAssiduité = exempte,
            CertificatMedicalFichierNom = dto.CertificatMedicalFichierNom,
            Commentaire = dto.Commentaire,
            Statut = dto.EstBrouillon
                           ? "Brouillon"
                           : "En attente de validation RH",
            CreatedAt = DateTime.UtcNow
        };

        _db.DemandesMaladie.Add(entity);

        // Log
        _db.HistoriqueActions.Add(new HistoriqueAction
        {
            TypeDemande = "maladie",
            DemandeId = 0,
            Action = dto.EstBrouillon ? "Brouillon" : "Soumission",
            AuteurMatricule = employe.Matricule,
            AuteurRole = "employe",
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        // Mettre à jour le DemandeId dans le log
        var log = _db.HistoriqueActions.Local.Last();
        log.DemandeId = entity.Id;
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id },
            new { entity.Id, entity.Statut });
    }

    // RH — Valider
    [HttpPost("{id}/valider")]
    [Authorize(Roles = "rh,admin")]
    public async Task<IActionResult> Valider(int id, [FromBody] ActionMaladieDto dto)
    {
        var d = await _db.DemandesMaladie.FindAsync(id);
        if (d == null) return NotFound();
        if (d.Statut != "En attente de validation RH")
            return BadRequest(new { message = "Statut invalide." });

        d.Statut = "Validée";
        d.UpdatedAt = DateTime.UtcNow;

        _db.HistoriqueActions.Add(new HistoriqueAction
        {
            TypeDemande = "maladie",
            DemandeId = id,
            Action = "Validation RH",
            AuteurMatricule = dto.AuteurMatricule,
            AuteurRole = "rh",
            Commentaire = dto.Commentaire,
            Timestamp = DateTime.UtcNow
        });

        // Notification
        await AddNotification(d.Matricule,
            $"Votre congé maladie du {d.DateDebut} au {d.DateFin} a été validé par la RH.");

        await _db.SaveChangesAsync();
        return Ok(new { statut = d.Statut });
    }

    // RH — Rejeter
    [HttpPost("{id}/rejeter")]
    [Authorize(Roles = "rh,admin")]
    public async Task<IActionResult> Rejeter(int id, [FromBody] ActionMaladieDto dto)
    {
        var d = await _db.DemandesMaladie.FindAsync(id);
        if (d == null) return NotFound();
        if (string.IsNullOrWhiteSpace(dto.Commentaire))
            return BadRequest(new { message = "Motif obligatoire." });

        d.Statut = "Rejetée";
        d.UpdatedAt = DateTime.UtcNow;

        _db.HistoriqueActions.Add(new HistoriqueAction
        {
            TypeDemande = "maladie",
            DemandeId = id,
            Action = "Rejet RH",
            AuteurMatricule = dto.AuteurMatricule,
            AuteurRole = "rh",
            Commentaire = dto.Commentaire,
            Timestamp = DateTime.UtcNow
        });

        await AddNotification(d.Matricule,
            $"Votre congé maladie a été rejeté. Motif : {dto.Commentaire}");

        await _db.SaveChangesAsync();
        return Ok(new { statut = d.Statut });
    }

    private async Task AddNotification(string matricule, string message)
    {
        _db.Notifications.Add(new Notification
        {
            DestinataireMatricule = matricule,
            Message = message,
            Timestamp = DateTime.UtcNow,
            IsRead = false
        });
        await Task.CompletedTask;
    }
}

public record CreateMaladieDto(
    string Matricule,
    string TypeMaladie,
    DateOnly DateDebut,
    DateOnly DateFin,
    string? CertificatMedicalFichierNom,
    string? Commentaire,
    bool EstBrouillon
);

public record ActionMaladieDto(
    string AuteurMatricule,
    string? Commentaire
);