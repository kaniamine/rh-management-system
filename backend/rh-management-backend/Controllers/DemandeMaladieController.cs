using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;
using rh_management_backend.Services;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/demandes-maladie")]
[Authorize]
public class DemandeMaladieController : ControllerBase
{
    private readonly RhDbContext _db;
    private readonly INotificationService _notif;

    public DemandeMaladieController(RhDbContext db, INotificationService notif)
    {
        _db    = db;
        _notif = notif;
    }

    // GET /api/demandes-maladie?matricule=...&statut=...
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? matricule,
        [FromQuery] string? statut)
    {
        var q = _db.DemandesMaladie.AsQueryable();
        if (!string.IsNullOrEmpty(matricule)) q = q.Where(d => d.Matricule == matricule);
        if (!string.IsNullOrEmpty(statut))    q = q.Where(d => d.Statut    == statut);
        return Ok(await q.OrderByDescending(d => d.CreatedAt).ToListAsync());
    }

    // GET /api/demandes-maladie/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _db.DemandesMaladie.FindAsync(id);
        return d == null ? NotFound() : Ok(d);
    }

    // GET /api/demandes-maladie/mon-equipe — Maladies des subordonnés du SH connecté
    [HttpGet("mon-equipe")]
    [Authorize]
    public async Task<IActionResult> GetMonEquipe()
    {
        try
        {
            var matriculeSH = User.FindFirst("matricule")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(matriculeSH))
                return Unauthorized(new { error = "Matricule introuvable dans le token." });

            // Récupérer les matricules de l'équipe supervisée par ce SH
            var matriculesEquipe = await _db.Employes
                .Where(e => e.SuperieurHierarchiqueMatricule == matriculeSH)
                .Select(e => e.Matricule)
                .ToListAsync();

            if (!matriculesEquipe.Any())
                return Ok(Array.Empty<object>());

            // Charger les demandes de maladie en mémoire avant de formatter les DateOnly
            var raw = await _db.DemandesMaladie
                .Where(d => matriculesEquipe.Contains(d.Matricule))
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            var maladies = raw.Select(d => new {
                d.Id,
                d.Matricule,
                d.NomComplet,
                d.Direction,
                d.Service,
                d.TypeMaladie,
                dateDebut                   = d.DateDebut.ToString("yyyy-MM-dd"),
                dateFin                     = d.DateFin.ToString("yyyy-MM-dd"),
                d.NombreJours,
                d.ExempteAssiduité,
                d.CertificatMedicalFichierNom,
                d.Commentaire,
                d.Statut,
                d.CreatedAt,
                d.UpdatedAt
            }).ToList();

            return Ok(maladies);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MALADIE SH] Erreur: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // POST /api/demandes-maladie — [FromForm] pour upload fichier
    [HttpPost]
    [Authorize(Roles = "employe,n1")]
    public async Task<IActionResult> Create([FromForm] CreateMaladieFormDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Matricule))
            return BadRequest(new { message = "Le matricule est obligatoire." });

        var employe = await _db.Employes.FirstOrDefaultAsync(e => e.Matricule == dto.Matricule.Trim());
        if (employe == null)
            return BadRequest(new { message = "Employé introuvable." });

        if (!dto.EstBrouillon && dto.CertificatMedical == null && string.IsNullOrWhiteSpace(dto.CertificatMedicalFichierNom))
            return BadRequest(new { message = "Le certificat médical est obligatoire." });

        if (!DateOnly.TryParse(dto.DateDebut, out var dateDebut) ||
            !DateOnly.TryParse(dto.DateFin,   out var dateFin))
            return BadRequest(new { message = "Format de date invalide (attendu : yyyy-MM-dd)." });

        if (dateFin < dateDebut)
            return BadRequest(new { message = "La date de fin doit être postérieure ou égale à la date de début." });

        int nbJours = dateFin.DayNumber - dateDebut.DayNumber + 1;
        bool exempte = dto.TypeMaladie is "Congé maternité" or "Congé pour chirurgie";

        string? nomFichier = null;
        if (dto.CertificatMedical != null)
            nomFichier = $"{dto.Matricule}_{DateTime.UtcNow:yyyyMMddHHmmss}_{dto.CertificatMedical.FileName}";
        else if (!string.IsNullOrWhiteSpace(dto.CertificatMedicalFichierNom))
            nomFichier = dto.CertificatMedicalFichierNom;

        var entity = new DemandeMaladie
        {
            Matricule                   = employe.Matricule,
            NomComplet                  = employe.NomComplet,
            Direction                   = employe.Direction ?? "",
            Service                     = employe.Service   ?? "",
            TypeMaladie                 = dto.TypeMaladie ?? "Maladie simple",
            DateDebut                   = dateDebut,
            DateFin                     = dateFin,
            NombreJours                 = nbJours,
            ExempteAssiduité            = exempte,
            CertificatMedicalFichierNom = nomFichier,
            Commentaire                 = string.IsNullOrWhiteSpace(dto.Commentaire) ? null : dto.Commentaire.Trim(),
            Statut                      = dto.EstBrouillon ? "Brouillon" : "En attente de validation RH",
            CreatedAt                   = DateTime.UtcNow
        };

        _db.DemandesMaladie.Add(entity);

        _db.HistoriqueActions.Add(new HistoriqueAction
        {
            TypeDemande     = "maladie",
            DemandeId       = 0,
            Action          = dto.EstBrouillon ? "Brouillon" : "Soumission",
            AuteurMatricule = employe.Matricule,
            AuteurRole      = "employe",
            Timestamp       = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        var log = _db.HistoriqueActions.Local.Last();
        log.DemandeId = entity.Id;
        await _db.SaveChangesAsync();

        if (!dto.EstBrouillon)
        {
            await _notif.NotifierRoleAsync("rh", "maladie", entity.Id, "soumission",
                $"Une nouvelle demande de congé de maladie de {entity.NomComplet} est en attente de validation. Un certificat médical a été joint.");
        }

        return CreatedAtAction(nameof(GetById), new { id = entity.Id },
            new { entity.Id, entity.Statut });
    }

    // POST /api/demandes-maladie/{id}/valider — RH
    [HttpPost("{id}/valider")]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> Valider(int id, [FromBody] ActionMaladieDto dto)
    {
        var role = User.FindFirst("role")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";
        if (role != "rh")
            return StatusCode(403, new { error = "Seule la Direction RH peut valider les demandes de maladie." });

        var d = await _db.DemandesMaladie.FindAsync(id);
        if (d == null) return NotFound();
        if (d.Statut != "En attente de validation RH")
            return BadRequest(new { message = "Statut invalide." });

        d.Statut    = "Validée";
        d.UpdatedAt = DateTime.UtcNow;

        _db.HistoriqueActions.Add(new HistoriqueAction
        {
            TypeDemande     = "maladie",
            DemandeId       = id,
            Action          = "Validation RH",
            AuteurMatricule = dto.AuteurMatricule,
            AuteurRole      = "rh",
            Commentaire     = dto.Commentaire,
            Timestamp       = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        await _notif.CreerNotificationAsync(
            d.Matricule, "employe", "maladie", id, "validation",
            "Votre demande de congé de maladie a été validée par la Direction RH.");

        var employe = await _db.Employes.FirstOrDefaultAsync(e => e.Matricule == d.Matricule);
        if (employe?.SuperieurHierarchiqueMatricule != null)
        {
            await _notif.CreerNotificationAsync(
                employe.SuperieurHierarchiqueMatricule,
                "n1", "maladie", id, "validation",
                $"Information : la demande de congé de maladie de {d.NomComplet} a été validée par la Direction RH.");
        }

        return Ok(new { statut = d.Statut });
    }

    // POST /api/demandes-maladie/{id}/rejeter — RH
    [HttpPost("{id}/rejeter")]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> Rejeter(int id, [FromBody] ActionMaladieDto dto)
    {
        var role = User.FindFirst("role")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";
        if (role != "rh")
            return StatusCode(403, new { error = "Seule la Direction RH peut rejeter les demandes de maladie." });

        var d = await _db.DemandesMaladie.FindAsync(id);
        if (d == null) return NotFound();
        if (string.IsNullOrWhiteSpace(dto.Commentaire))
            return BadRequest(new { message = "Motif obligatoire." });

        d.Statut    = "Rejetée";
        d.UpdatedAt = DateTime.UtcNow;

        _db.HistoriqueActions.Add(new HistoriqueAction
        {
            TypeDemande     = "maladie",
            DemandeId       = id,
            Action          = "Rejet RH",
            AuteurMatricule = dto.AuteurMatricule,
            AuteurRole      = "rh",
            Commentaire     = dto.Commentaire,
            Timestamp       = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        await _notif.CreerNotificationAsync(
            d.Matricule, "employe", "maladie", id, "rejet",
            $"Votre demande de congé de maladie a été rejetée par la Direction RH. Motif : {dto.Commentaire}");

        return Ok(new { statut = d.Statut });
    }

    // POST /api/demandes-maladie/{id}/annuler — Employé
    [HttpPost("{id}/annuler")]
    public async Task<IActionResult> Annuler(int id, [FromBody] ActionMaladieDto dto)
    {
        var d = await _db.DemandesMaladie.FindAsync(id);
        if (d == null) return NotFound();

        var annulables = new[] { "Brouillon", "En attente de validation RH" };
        if (!annulables.Contains(d.Statut))
            return BadRequest(new { message = $"Impossible d'annuler une demande au statut : {d.Statut}" });

        d.Statut    = "Annulée";
        d.UpdatedAt = DateTime.UtcNow;

        _db.HistoriqueActions.Add(new HistoriqueAction
        {
            TypeDemande     = "maladie",
            DemandeId       = id,
            Action          = "Annulation",
            AuteurMatricule = dto.AuteurMatricule,
            AuteurRole      = "employe",
            Commentaire     = dto.Commentaire,
            Timestamp       = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        await _notif.NotifierRoleAsync("rh", "maladie", id, "annulation",
            $"La demande de congé de maladie de {d.NomComplet} a été annulée par l'employé.");

        return Ok(new { statut = d.Statut });
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public class CreateMaladieFormDto
{
    public string?    Matricule                   { get; set; }
    public string?    TypeMaladie                 { get; set; }
    public string?    DateDebut                   { get; set; }
    public string?    DateFin                     { get; set; }
    public IFormFile? CertificatMedical           { get; set; }
    public string?    CertificatMedicalFichierNom { get; set; }
    public string?    Commentaire                 { get; set; }
    public bool       EstBrouillon                { get; set; }
}

public record ActionMaladieDto(
    string AuteurMatricule,
    string? Commentaire
);
