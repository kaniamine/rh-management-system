using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize(Roles = "rh,admin")]
public class AnalyticsController : ControllerBase
{
    private readonly RhDbContext _db;

    public AnalyticsController(RhDbContext db) => _db = db;

    [HttpGet("rh-dashboard")]
    public async Task<IActionResult> GetRhDashboard()
    {
        var conges        = await _db.DemandesConges.ToListAsync();
        var autorisations = await _db.DemandesAutorisations.ToListAsync();
        var maladies      = await _db.DemandesMaladie.ToListAsync();
        var employes      = await _db.Employes.ToListAsync();

        // ── Helpers ──────────────────────────────────────────────────────────
        static bool IsValide(string s)    => s == "Validée" || s == "Validée – En traitement RH" || s == "Clôturée";
        static bool IsRejete(string s)    => s.StartsWith("Rejetée") || s == "Annulée";
        static bool IsEnAttente(string s) => s.StartsWith("En attente");

        // ── Counts ────────────────────────────────────────────────────────────
        int totalConges        = conges.Count;
        int totalAutorisations = autorisations.Count;
        int totalMaladies      = maladies.Count;
        int totalDemandes      = totalConges + totalAutorisations + totalMaladies;

        int validees  = conges.Count(d => IsValide(d.Statut))
                      + autorisations.Count(d => IsValide(d.Statut))
                      + maladies.Count(d => IsValide(d.Statut));
        int rejetees  = conges.Count(d => IsRejete(d.Statut))
                      + autorisations.Count(d => IsRejete(d.Statut))
                      + maladies.Count(d => IsRejete(d.Statut));
        int enAttente = conges.Count(d => IsEnAttente(d.Statut))
                      + autorisations.Count(d => IsEnAttente(d.Statut))
                      + maladies.Count(d => IsEnAttente(d.Statut));
        int cloturees = conges.Count(d => d.Statut == "Clôturée");

        double tauxValidation = totalDemandes > 0 ? Math.Round((double)validees  / totalDemandes * 100, 1) : 0;
        double tauxRejet      = totalDemandes > 0 ? Math.Round((double)rejetees  / totalDemandes * 100, 1) : 0;

        int    totalJoursConge   = conges.Where(d => IsValide(d.Statut)).Sum(d => d.DureeJours);
        int    totalJoursMaladie = maladies.Where(d => IsValide(d.Statut)).Sum(d => d.NombreJours);

        double tauxValidationConge   = totalConges        > 0 ? Math.Round((double)conges.Count(d => IsValide(d.Statut))        / totalConges        * 100, 1) : 0;
        double tauxValidationAuto    = totalAutorisations > 0 ? Math.Round((double)autorisations.Count(d => IsValide(d.Statut))  / totalAutorisations * 100, 1) : 0;
        double tauxValidationMaladie = totalMaladies      > 0 ? Math.Round((double)maladies.Count(d => IsValide(d.Statut))      / totalMaladies      * 100, 1) : 0;

        double moyenneSoldeConges = employes.Any() ? Math.Round(employes.Average(e => (double)e.SoldeConges), 1) : 0;
        int    totalEmployes      = employes.Count(e => e.IsActive);

        // ── Mois labels ───────────────────────────────────────────────────────
        string[] moisLabels = { "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc" };

        // ── Demandes par mois (all) ───────────────────────────────────────────
        var demandesParMois = conges.Select(d => d.CreatedAt)
            .Concat(autorisations.Select(d => d.CreatedAt))
            .Concat(maladies.Select(d => d.CreatedAt))
            .GroupBy(d => d.Month)
            .OrderBy(g => g.Key)
            .Select(g => new { mois = moisLabels[g.Key - 1], count = g.Count() })
            .ToList();

        // ── Congés validées par mois ──────────────────────────────────────────
        var congesValideesParMois = conges
            .Where(d => IsValide(d.Statut))
            .GroupBy(d => d.CreatedAt.Month)
            .OrderBy(g => g.Key)
            .Select(g => new { mois = moisLabels[g.Key - 1], count = g.Count() })
            .ToList();

        // ── Répartition par type ──────────────────────────────────────────────
        var repartitionParType = new[]
        {
            new { type = "Congés",        count = totalConges        },
            new { type = "Autorisations", count = totalAutorisations },
            new { type = "Maladies",      count = totalMaladies      }
        };

        // ── Répartition par statut ────────────────────────────────────────────
        var repartitionParStatut = conges.Select(d => d.Statut)
            .Concat(autorisations.Select(d => d.Statut))
            .Concat(maladies.Select(d => d.Statut))
            .GroupBy(s => s)
            .OrderByDescending(g => g.Count())
            .Select(g => new { statut = g.Key, count = g.Count() })
            .ToList();

        // ── Demandes par direction ────────────────────────────────────────────
        // DemandeAutorisation + DemandeMaladie have Direction; DemandeConge uses Service
        var directionCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var g in autorisations.Where(d => !string.IsNullOrEmpty(d.Direction)).GroupBy(d => d.Direction))
            directionCounts[g.Key] = directionCounts.GetValueOrDefault(g.Key) + g.Count();
        foreach (var g in maladies.Where(d => !string.IsNullOrEmpty(d.Direction)).GroupBy(d => d.Direction))
            directionCounts[g.Key] = directionCounts.GetValueOrDefault(g.Key) + g.Count();
        foreach (var g in conges.Where(d => !string.IsNullOrEmpty(d.Service)).GroupBy(d => d.Service!))
            directionCounts[g.Key] = directionCounts.GetValueOrDefault(g.Key) + g.Count();

        var demandesParDirection = directionCounts
            .OrderByDescending(kv => kv.Value)
            .Select(kv => new { direction = kv.Key, count = kv.Value })
            .ToList();

        // ── Type congé breakdown ──────────────────────────────────────────────
        var typeCongeBreakdown = conges
            .GroupBy(d => d.TypeConge)
            .OrderByDescending(g => g.Count())
            .Select(g => new { type = g.Key, count = g.Count() })
            .ToList();

        return Ok(new
        {
            totalDemandes,
            totalConges,
            totalAutorisations,
            totalMaladies,
            enAttente,
            validees,
            rejetees,
            cloturees,
            tauxValidation,
            tauxRejet,
            moyenneSoldeConges,
            totalJoursMaladie,
            totalJoursConge,
            tauxValidationConge,
            tauxValidationAuto,
            tauxValidationMaladie,
            totalEmployes,
            demandesParMois,
            congesValideesParMois,
            repartitionParType,
            repartitionParStatut,
            demandesParDirection,
            typeCongeBreakdown
        });
    }
}
