using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.DTOs.Statistics;

namespace rh_management_backend.Services;

public class RhStatisticsService : IRhStatisticsService
{
    private readonly RhDbContext _db;

    public RhStatisticsService(RhDbContext db) => _db = db;

    // ── Overview ──────────────────────────────────────────────────────────────

    public async Task<OverviewStatsDto> GetOverviewAsync(int? annee, int? mois)
    {
        var conges       = await CongesQuery(annee, mois).ToListAsync();
        var maladies     = await MaladiesQuery(annee, mois).ToListAsync();
        var autorisations = await AutorisationsQuery(annee, mois).ToListAsync();
        int employesActifs = await _db.Employes.CountAsync(e => e.IsActive);

        var congeKpis = new KpiCountsDto
        {
            Total     = conges.Count,
            EnAttente = conges.Count(c => c.Statut.StartsWith("En attente")),
            Validees  = conges.Count(c => c.Statut is "Validée – En traitement RH"
                                       or "Validee – En traitement RH"
                                       or "Validee - En traitement RH"),
            Cloturees = conges.Count(c => c.Statut is "Clôturée" or "Cloturee"),
            Rejetees  = conges.Count(c => c.Statut.StartsWith("Rejetée") || c.Statut.StartsWith("Rejetee")),
            Annulees  = conges.Count(c => c.Statut is "Annulée" or "Annulee"),
        };

        var maladieKpis = new KpiCountsDto
        {
            Total     = maladies.Count,
            EnAttente = maladies.Count(m => m.Statut == "En attente de validation RH"),
            Validees  = maladies.Count(m => m.Statut is "Validée" or "Validee"),
            Rejetees  = maladies.Count(m => m.Statut is "Rejetée" or "Rejetee"),
            Annulees  = maladies.Count(m => m.Statut is "Annulée" or "Annulee"),
        };

        var autoKpis = new KpiCountsDto
        {
            Total     = autorisations.Count,
            EnAttente = autorisations.Count(a => a.Statut == "En attente de validation du supérieur hiérarchique"),
            Validees  = autorisations.Count(a => a.Statut is "Validée" or "Validee"),
            Rejetees  = autorisations.Count(a => a.Statut is "Rejetée" or "Rejetee"),
            Annulees  = autorisations.Count(a => a.Statut is "Annulée" or "Annulee"),
        };

        // Items actively waiting on RH: conges post-DG approval + pending maladie validations
        int totalEnAttenteRH =
            conges.Count(c => c.Statut is "Validée – En traitement RH"
                           or "Validee – En traitement RH"
                           or "Validee - En traitement RH") +
            maladies.Count(m => m.Statut == "En attente de validation RH");

        // Trend: always last 12 months regardless of query filters (gives historical context)
        var cutoff = DateTime.UtcNow.AddMonths(-12);
        var trendCongesDates        = await _db.DemandesConges.AsNoTracking()
            .Where(c => c.CreatedAt >= cutoff).Select(c => c.CreatedAt).ToListAsync();
        var trendMaladiesDates      = await _db.DemandesMaladie.AsNoTracking()
            .Where(m => m.CreatedAt >= cutoff).Select(m => m.CreatedAt).ToListAsync();
        var trendAutorisationsDates = await _db.DemandesAutorisations.AsNoTracking()
            .Where(a => a.CreatedAt >= cutoff).Select(a => a.CreatedAt).ToListAsync();

        return new OverviewStatsDto
        {
            TotalEmployesActifs    = employesActifs,
            Conges                 = congeKpis,
            Maladies               = maladieKpis,
            Autorisations          = autoKpis,
            TotalEnAttenteActionRH = totalEnAttenteRH,
            TendanceMensuelle      = BuildTrend(trendCongesDates, trendMaladiesDates, trendAutorisationsDates),
        };
    }

    // ── Per-type detailed stats ───────────────────────────────────────────────

    public async Task<CongeStatsDto> GetCongeStatsAsync(int? annee, int? mois)
    {
        var conges = await CongesQuery(annee, mois).ToListAsync();

        return new CongeStatsDto
        {
            Total              = conges.Count,
            ParStatut          = conges.GroupBy(c => c.Statut).ToDictionary(g => g.Key, g => g.Count()),
            ParTypeConge       = conges.GroupBy(c => c.TypeConge).ToDictionary(g => g.Key, g => g.Count()),
            ParService         = conges.Where(c => !string.IsNullOrEmpty(c.Service))
                                       .GroupBy(c => c.Service!).ToDictionary(g => g.Key, g => g.Count()),
            DureeMoyenneJours  = conges.Count > 0 ? Math.Round(conges.Average(c => (double)c.DureeJours), 1) : 0,
            EnAttenteN1        = conges.Count(c => c.Statut == "En attente de validation N+1"),
            EnAttenteDG        = conges.Count(c => c.Statut == "En attente de validation DG"),
            EnAttenteRH        = conges.Count(c => c.Statut is "Validée – En traitement RH"
                                                or "Validee – En traitement RH"
                                                or "Validee - En traitement RH"),
        };
    }

    public async Task<MaladieStatsDto> GetMaladieStatsAsync(int? annee, int? mois)
    {
        var maladies = await MaladiesQuery(annee, mois).ToListAsync();

        return new MaladieStatsDto
        {
            Total                = maladies.Count,
            ParStatut            = maladies.GroupBy(m => m.Statut).ToDictionary(g => g.Key, g => g.Count()),
            ParTypeMaladie       = maladies.GroupBy(m => m.TypeMaladie).ToDictionary(g => g.Key, g => g.Count()),
            ParService           = maladies.Where(m => !string.IsNullOrEmpty(m.Service))
                                           .GroupBy(m => m.Service!).ToDictionary(g => g.Key, g => g.Count()),
            DureeMoyenneJours    = maladies.Count > 0 ? Math.Round(maladies.Average(m => (double)m.NombreJours), 1) : 0,
            ExemptesAssiduité    = maladies.Count(m => m.ExempteAssiduité),
            EnAttenteValidationRH = maladies.Count(m => m.Statut == "En attente de validation RH"),
        };
    }

    public async Task<AutorisationStatsDto> GetAutorisationStatsAsync(int? annee, int? mois)
    {
        var autorisations = await AutorisationsQuery(annee, mois).ToListAsync();
        var avecDuree     = autorisations.Where(a => a.DureeMinutes.HasValue).ToList();

        return new AutorisationStatsDto
        {
            Total                 = autorisations.Count,
            ParStatut             = autorisations.GroupBy(a => a.Statut).ToDictionary(g => g.Key, g => g.Count()),
            ParTypeAutorisation   = autorisations.GroupBy(a => a.TypeAutorisation).ToDictionary(g => g.Key, g => g.Count()),
            ParService            = autorisations.Where(a => !string.IsNullOrEmpty(a.Service))
                                                 .GroupBy(a => a.Service!).ToDictionary(g => g.Key, g => g.Count()),
            DureeMoyenneMinutes   = avecDuree.Count > 0 ? Math.Round(avecDuree.Average(a => (double)a.DureeMinutes!.Value), 1) : 0,
            EnAttenteN1           = autorisations.Count(a => a.Statut == "En attente de validation du supérieur hiérarchique"),
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private IQueryable<Models.DemandeConge> CongesQuery(int? annee, int? mois)
    {
        var q = _db.DemandesConges.AsNoTracking().AsQueryable();
        if (annee.HasValue) q = q.Where(c => c.CreatedAt.Year  == annee.Value);
        if (mois.HasValue)  q = q.Where(c => c.CreatedAt.Month == mois.Value);
        return q;
    }

    private IQueryable<Models.DemandeMaladie> MaladiesQuery(int? annee, int? mois)
    {
        var q = _db.DemandesMaladie.AsNoTracking().AsQueryable();
        if (annee.HasValue) q = q.Where(m => m.CreatedAt.Year  == annee.Value);
        if (mois.HasValue)  q = q.Where(m => m.CreatedAt.Month == mois.Value);
        return q;
    }

    private IQueryable<Models.DemandeAutorisation> AutorisationsQuery(int? annee, int? mois)
    {
        var q = _db.DemandesAutorisations.AsNoTracking().AsQueryable();
        if (annee.HasValue) q = q.Where(a => a.CreatedAt.Year  == annee.Value);
        if (mois.HasValue)  q = q.Where(a => a.CreatedAt.Month == mois.Value);
        return q;
    }

    private static List<MonthlyTrendDto> BuildTrend(
        List<DateTime> congesDates,
        List<DateTime> maladiesDates,
        List<DateTime> autorisationsDates)
    {
        var now = DateTime.UtcNow;

        return Enumerable.Range(0, 12)
            .Select(i => now.AddMonths(-11 + i))
            .Select(d => new MonthlyTrendDto
            {
                Mois          = $"{d.Year}-{d.Month:D2}",
                Conges        = congesDates.Count(x => x.Year == d.Year && x.Month == d.Month),
                Maladies      = maladiesDates.Count(x => x.Year == d.Year && x.Month == d.Month),
                Autorisations = autorisationsDates.Count(x => x.Year == d.Year && x.Month == d.Month),
            })
            .ToList();
    }
}
