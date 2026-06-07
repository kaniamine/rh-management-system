using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace rh_management_backend.Models;

public class Parametrage
{
    [Key]
    public int Id { get; set; }

    // ── Plages horaires ───────────────────────────────────────────────────────
    [MaxLength(10)] public string HoraireMatinDebut      { get; set; } = "08:00";
    [MaxLength(10)] public string HoraireMatinFin        { get; set; } = "12:00";
    [MaxLength(10)] public string HorairePauseDebut      { get; set; } = "12:00";
    [MaxLength(10)] public string HorairePauseFin        { get; set; } = "13:00";
    [MaxLength(10)] public string HoraireApresMidiDebut  { get; set; } = "13:00";
    [MaxLength(10)] public string HoraireApresMidiFin    { get; set; } = "17:20";
    public bool   HoraireEteActif        { get; set; } = false;
    [MaxLength(10)] public string HoraireEtePeriodeDebut { get; set; } = "01/07";
    [MaxLength(10)] public string HoraireEtePeriodeFin   { get; set; } = "31/08";
    [MaxLength(10)] public string HoraireEtePlageDebut   { get; set; } = "07:30";
    [MaxLength(10)] public string HoraireEtePlageFin     { get; set; } = "13:30";
    public bool   HoraireRamadanActif    { get; set; } = false;

    // ── Congés ───────────────────────────────────────────────────────────────
    public bool CongesUniteJoursOuvres { get; set; } = true;
    public bool CongesInclusionWeekend { get; set; } = true;
    public bool CongesInclusionFeries { get; set; }
    public bool CongesDebitApresValidation { get; set; } = true;
    public int CongesSoldeMinimum { get; set; } = 1;
    public int CongesDelaiDepot { get; set; } = 2;
    public bool CongesMotifObligatoire { get; set; } = true;

    // ── Autorisations ─────────────────────────────────────────────────────────
    public string AutoriMatinDebut { get; set; } = "08:00";
    public string AutoriMatinFin { get; set; } = "12:00";
    public string AutoriPauseDebut { get; set; } = "12:00";
    public string AutoriPauseFin { get; set; } = "13:00";
    public string AutoriApremDebut { get; set; } = "13:00";
    public string AutoriApremFin { get; set; } = "17:20";
    public bool AutoriEteActif { get; set; } = true;
    public string AutoriEteDebut { get; set; } = "01/07";
    public string AutoriEteFin { get; set; } = "31/08";
    public string AutoriEteHeureDebut { get; set; } = "07:30";
    public string AutoriEteHeureFin { get; set; } = "13:30";
    public bool AutoriRamadanActif { get; set; }
    public string AutoriRamadanDebut { get; set; } = "08:00";
    public string AutoriRamadanFin { get; set; } = "14:30";
    public int AutoriDureeMaxPerso { get; set; } = 90;
    public bool AutoriBlocageAuto { get; set; } = true;

    // ── Maladie ───────────────────────────────────────────────────────────────
    public bool MaladieCertificatObligatoire { get; set; } = true;
    public bool MaladieValidationRhOnly { get; set; } = true;
    public bool MaladieExclusionAssiduite { get; set; } = true;

    // ── JSON arrays (personnel, roles, workflow, maladie types, barème, notifs)
    [Column(TypeName = "nvarchar(max)")]
    public string PersonnelFieldsJson { get; set; } = "[]";

    [Column(TypeName = "nvarchar(max)")]
    public string RolePermsJson { get; set; } = "{}";

    [Column(TypeName = "nvarchar(max)")]
    public string WorkflowStepsJson { get; set; } = "[]";

    [Column(TypeName = "nvarchar(max)")]
    public string MaladieTypesJson { get; set; } = "[]";

    [Column(TypeName = "nvarchar(max)")]
    public string AssiduiteBaremeJson { get; set; } = "[]";

    [Column(TypeName = "nvarchar(max)")]
    public string NotificationsJson { get; set; } = "[]";
}
