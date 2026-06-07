namespace rh_management_backend.DTOs.Parametrage;

public class ParametrageDto
{
    public List<PersonnelFieldDto> PersonnelFields { get; set; } = new();
    public Dictionary<string, Dictionary<string, bool>> RolePerms { get; set; } = new();
    public CongesConfigDto CongesConfig { get; set; } = new();
    public List<WorkflowStepDto> WorkflowSteps { get; set; } = new();
    public AutoriConfigDto AutoriConfig { get; set; } = new();
    public List<MaladieTypeDto> MaladieTypes { get; set; } = new();
    public MaladieConfigDto MaladieConfig { get; set; } = new();
    public List<BaremeRowDto> Bareme { get; set; } = new();
    public List<NotificationConfigDto> Notifications { get; set; } = new();
}

public class PersonnelFieldDto
{
    public string Key { get; set; } = "";
    public string Label { get; set; } = "";
    public bool Required { get; set; }
    public bool Editable { get; set; }
}

public class CongesConfigDto
{
    public bool UniteJoursOuvres { get; set; } = true;
    public bool InclusionWeekend { get; set; } = true;
    public bool InclusionFeries { get; set; }
    public bool DebitApresValidation { get; set; } = true;
    public int SoldeMinimum { get; set; } = 1;
    public int DelaiDepot { get; set; } = 2;
    public bool MotifObligatoire { get; set; } = true;
}

public class WorkflowStepDto
{
    public string Label { get; set; } = "";
    public string Sublabel { get; set; } = "";
    public bool Locked { get; set; }
    public bool Active { get; set; }
}

public class AutoriConfigDto
{
    public string MatinDebut { get; set; } = "08:00";
    public string MatinFin { get; set; } = "12:00";
    public string PauseDebut { get; set; } = "12:00";
    public string PauseFin { get; set; } = "13:00";
    public string ApremDebut { get; set; } = "13:00";
    public string ApremFin { get; set; } = "17:20";
    public bool EteActif { get; set; } = true;
    public string EteDebut { get; set; } = "01/07";
    public string EteFin { get; set; } = "31/08";
    public string EteHeureDebut { get; set; } = "07:30";
    public string EteHeureFin { get; set; } = "13:30";
    public bool RamadanActif { get; set; }
    public string RamadanDebut { get; set; } = "08:00";
    public string RamadanFin { get; set; } = "14:30";
    public int DureeMaxPerso { get; set; } = 90;
    public bool BlocageAuto { get; set; } = true;
}

public class MaladieTypeDto
{
    public string Label { get; set; } = "";
    public bool Exempte { get; set; }
}

public class MaladieConfigDto
{
    public bool CertificatObligatoire { get; set; } = true;
    public bool ValidationRhOnly { get; set; } = true;
    public bool ExclusionAssiduite { get; set; } = true;
}

public class BaremeRowDto
{
    public string Tranche { get; set; } = "";
    public double Points { get; set; }
}

public class NotificationConfigDto
{
    public string Label { get; set; } = "";
    public string Desc { get; set; } = "";
    public bool Active { get; set; }
}

// Wrapper pour GET+PUT /api/parametrage/conges-maladie
// Correspond exactement au payload Angular : { types, config }
public class CongesMaladieDto
{
    public List<MaladieTypeDto> Types  { get; set; } = new();
    public MaladieConfigDto     Config { get; set; } = new();
}

public class PlagesHorairesDto
{
    public string HoraireMatinDebut      { get; set; } = "08:00";
    public string HoraireMatinFin        { get; set; } = "12:00";
    public string HorairePauseDebut      { get; set; } = "12:00";
    public string HorairePauseFin        { get; set; } = "13:00";
    public string HoraireApresMidiDebut  { get; set; } = "13:00";
    public string HoraireApresMidiFin    { get; set; } = "17:20";
    public bool   HoraireEteActif        { get; set; } = false;
    public string HoraireEtePeriodeDebut { get; set; } = "01/07";
    public string HoraireEtePeriodeFin   { get; set; } = "31/08";
    public string HoraireEtePlageDebut   { get; set; } = "07:30";
    public string HoraireEtePlageFin     { get; set; } = "13:30";
    public bool   HoraireRamadanActif    { get; set; } = false;
}
