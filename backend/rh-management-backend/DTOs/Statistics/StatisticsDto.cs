namespace rh_management_backend.DTOs.Statistics;

public class OverviewStatsDto
{
    public int TotalEmployesActifs { get; set; }
    public KpiCountsDto Conges { get; set; } = new();
    public KpiCountsDto Maladies { get; set; } = new();
    public KpiCountsDto Autorisations { get; set; } = new();
    // Demandes currently sitting in RH's action queue
    public int TotalEnAttenteActionRH { get; set; }
    public List<MonthlyTrendDto> TendanceMensuelle { get; set; } = [];
}

public class KpiCountsDto
{
    public int Total { get; set; }
    public int EnAttente { get; set; }
    public int Validees { get; set; }
    public int Cloturees { get; set; }
    public int Rejetees { get; set; }
    public int Annulees { get; set; }
}

public class MonthlyTrendDto
{
    public string Mois { get; set; } = string.Empty; // "YYYY-MM"
    public int Conges { get; set; }
    public int Maladies { get; set; }
    public int Autorisations { get; set; }
}

public class CongeStatsDto
{
    public int Total { get; set; }
    public Dictionary<string, int> ParStatut { get; set; } = [];
    public Dictionary<string, int> ParTypeConge { get; set; } = [];
    public Dictionary<string, int> ParService { get; set; } = [];
    public double DureeMoyenneJours { get; set; }
    // Workflow pending counts
    public int EnAttenteN1 { get; set; }
    public int EnAttenteDG { get; set; }
    public int EnAttenteRH { get; set; }
}

public class MaladieStatsDto
{
    public int Total { get; set; }
    public Dictionary<string, int> ParStatut { get; set; } = [];
    public Dictionary<string, int> ParTypeMaladie { get; set; } = [];
    public Dictionary<string, int> ParService { get; set; } = [];
    public double DureeMoyenneJours { get; set; }
    public int ExemptesAssiduité { get; set; }
    public int EnAttenteValidationRH { get; set; }
}

public class AutorisationStatsDto
{
    public int Total { get; set; }
    public Dictionary<string, int> ParStatut { get; set; } = [];
    public Dictionary<string, int> ParTypeAutorisation { get; set; } = [];
    public Dictionary<string, int> ParService { get; set; } = [];
    public double DureeMoyenneMinutes { get; set; }
    public int EnAttenteN1 { get; set; }
}
