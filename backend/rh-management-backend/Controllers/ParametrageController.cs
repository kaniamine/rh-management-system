using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using rh_management_backend.Data;
using rh_management_backend.DTOs.Parametrage;
using rh_management_backend.Models;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/parametrage")]
[Authorize]
public class ParametrageController : ControllerBase
{
    private readonly RhDbContext                    _db;
    private readonly ILogger<ParametrageController> _logger;

    public ParametrageController(RhDbContext db, ILogger<ParametrageController> logger)
    {
        _db     = db;
        _logger = logger;
    }

    // GET /api/parametrage — seeds one row with defaults if table is empty
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var entity = await _db.Parametrages.FirstOrDefaultAsync();
        if (entity == null)
        {
            entity = BuildDefault();
            _db.Parametrages.Add(entity);
            await _db.SaveChangesAsync();
        }
        return Ok(ToDto(entity));
    }

    // PUT /api/parametrage — update the single settings row
    [HttpPut]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> Put([FromBody] ParametrageDto dto)
    {
        var entity = await _db.Parametrages.FirstOrDefaultAsync();
        if (entity == null)
        {
            entity = new Parametrage();
            _db.Parametrages.Add(entity);
        }
        ApplyDto(entity, dto);
        await _db.SaveChangesAsync();
        return Ok(ToDto(entity));
    }

    // GET /api/parametrage/conges-maladie
    [HttpGet("conges-maladie")]
    public async Task<IActionResult> GetCongesMaladie()
    {
        _logger.LogInformation("[ParametrageController] GET /api/parametrage/conges-maladie atteint");

        var entity = await _db.Parametrages.FirstOrDefaultAsync();
        if (entity == null)
        {
            entity = BuildDefault();
            _db.Parametrages.Add(entity);
            await _db.SaveChangesAsync();
        }
        return Ok(ToCongesMaladieDto(entity));
    }

    // PUT /api/parametrage/conges-maladie
    // Payload Angular : { types: [{label, exempte}], config: {certificatObligatoire, validationRhOnly, exclusionAssiduite} }
    [HttpPut("conges-maladie")]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> PutCongesMaladie([FromBody] CongesMaladieDto dto)
    {
        _logger.LogInformation("[ParametrageController] PUT /api/parametrage/conges-maladie atteint — types:{TypesCount} config:{Config}",
            dto.Types.Count, System.Text.Json.JsonSerializer.Serialize(dto.Config));

        var entity = await _db.Parametrages.FirstOrDefaultAsync();
        if (entity == null)
        {
            entity = BuildDefault();
            _db.Parametrages.Add(entity);
        }
        ApplyCongesMaladieDto(entity, dto);
        await _db.SaveChangesAsync();

        _logger.LogInformation("[ParametrageController] Congés maladie sauvegardés en base (Id={Id})", entity.Id);
        return Ok(ToCongesMaladieDto(entity));
    }

    // GET /api/parametrage/plages-horaires
    [HttpGet("plages-horaires")]
    public async Task<IActionResult> GetPlagesHoraires()
    {
        var entity = await _db.Parametrages.FirstOrDefaultAsync();
        if (entity == null)
        {
            entity = BuildDefault();
            _db.Parametrages.Add(entity);
            await _db.SaveChangesAsync();
        }
        return Ok(ToPlagesHorairesDto(entity));
    }

    // PUT /api/parametrage/plages-horaires
    [HttpPut("plages-horaires")]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> PutPlagesHoraires([FromBody] PlagesHorairesDto dto)
    {
        var entity = await _db.Parametrages.FirstOrDefaultAsync();
        if (entity == null)
        {
            entity = BuildDefault();
            _db.Parametrages.Add(entity);
        }
        ApplyPlagesHorairesDto(entity, dto);
        await _db.SaveChangesAsync();
        return Ok(ToPlagesHorairesDto(entity));
    }

    // POST /api/parametrage/sauvegarder — mise à jour partielle par section
    [HttpPost("sauvegarder")]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> Sauvegarder([FromBody] SauvegarderDto dto)
    {
        var entity = await _db.Parametrages.FirstOrDefaultAsync();
        if (entity == null)
        {
            entity = BuildDefault();
            _db.Parametrages.Add(entity);
        }

        switch (dto.Section.ToLowerInvariant())
        {
            case "workflow":
                var steps = JsonSerializer.Deserialize<List<WorkflowStepDto>>(
                    entity.WorkflowStepsJson, JsonOpts) ?? new();

                if (dto.Donnees.TryGetProperty("superieurHierarchiqueActif", out var shProp) && steps.Count > 1)
                    steps[1].Active = shProp.GetBoolean();
                if (dto.Donnees.TryGetProperty("dgActif", out var dgProp) && steps.Count > 2)
                    steps[2].Active = dgProp.GetBoolean();

                entity.WorkflowStepsJson = JsonSerializer.Serialize(steps, JsonOpts);
                break;
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Configuration sauvegardée.", section = dto.Section });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private static Parametrage BuildDefault()
    {
        var dto = new ParametrageDto
        {
            PersonnelFields = new()
            {
                new() { Key = "matricule",     Label = "Matricule",                       Required = true,  Editable = false },
                new() { Key = "nom",           Label = "Nom / Prénom",                    Required = true,  Editable = true  },
                new() { Key = "direction",     Label = "Direction & Service",             Required = true,  Editable = true  },
                new() { Key = "fonction",      Label = "Fonction",                        Required = false, Editable = true  },
                new() { Key = "superieur",     Label = "Supérieur hiérarchique direct",   Required = false, Editable = true  },
                new() { Key = "solde",         Label = "Solde de congés",                 Required = false, Editable = true  },
                new() { Key = "autorisations", Label = "Nature & nombre d'autorisations", Required = false, Editable = true  },
            },
            RolePerms = new()
            {
                ["employe"] = new() { ["create"] = true,  ["validate"] = false, ["history"] = true,  ["cloture"] = false, ["reporting"] = false },
                ["n1"]      = new() { ["create"] = false, ["validate"] = true,  ["history"] = true,  ["cloture"] = false, ["reporting"] = false },
                ["dg"]      = new() { ["create"] = false, ["validate"] = true,  ["history"] = true,  ["cloture"] = false, ["reporting"] = true  },
                ["rh"]      = new() { ["create"] = true,  ["validate"] = true,  ["history"] = true,  ["cloture"] = true,  ["reporting"] = true  },
            },
            CongesConfig = new()
            {
                UniteJoursOuvres     = true,
                InclusionWeekend     = true,
                InclusionFeries      = false,
                DebitApresValidation = true,
                SoldeMinimum         = 1,
                DelaiDepot           = 2,
                MotifObligatoire     = true,
            },
            WorkflowSteps = new()
            {
                new() { Label = "Employé",            Sublabel = "Soumission de la demande", Locked = true,  Active = true },
                new() { Label = "Responsable N+1",    Sublabel = "Validation hiérarchique",  Locked = false, Active = true },
                new() { Label = "Direction Générale", Sublabel = "Validation DG",            Locked = false, Active = true },
                new() { Label = "Direction RH",       Sublabel = "Traitement final",         Locked = true,  Active = true },
            },
            AutoriConfig = new()
            {
                MatinDebut    = "08:00", MatinFin    = "12:00",
                PauseDebut    = "12:00", PauseFin    = "13:00",
                ApremDebut    = "13:00", ApremFin    = "17:20",
                EteActif      = true,
                EteDebut      = "01/07", EteFin      = "31/08",
                EteHeureDebut = "07:30", EteHeureFin = "13:30",
                RamadanActif  = false,
                RamadanDebut  = "08:00", RamadanFin  = "14:30",
                DureeMaxPerso = 90,
                BlocageAuto   = true,
            },
            MaladieTypes = new()
            {
                new() { Label = "Maladie simple",  Exempte = false },
                new() { Label = "Congé maternité", Exempte = true  },
                new() { Label = "Congé chirurgie", Exempte = true  },
            },
            MaladieConfig = new()
            {
                CertificatObligatoire = true,
                ValidationRhOnly      = true,
                ExclusionAssiduite    = true,
            },
            Bareme = new()
            {
                new() { Tranche = "0 – 10 jours",  Points = 0   },
                new() { Tranche = "11 – 15 jours", Points = 0.5 },
                new() { Tranche = "16 – 20 jours", Points = 1   },
                new() { Tranche = "21 – 30 jours", Points = 2   },
                new() { Tranche = "> 30 jours",    Points = 3   },
            },
            Notifications = new()
            {
                new() { Label = "Soumission de demande", Desc = "Envoyée à l'employé et au responsable N+1 lors de la création.", Active = true },
                new() { Label = "Validation / Rejet",    Desc = "Informer l'employé du résultat à chaque étape du circuit.",     Active = true },
                new() { Label = "Clôture RH",            Desc = "Notifier l'employé lorsque la RH finalise le dossier.",         Active = true },
                new() { Label = "Annulation",            Desc = "Alerter les valideurs en cas d'annulation par l'employé.",      Active = true },
            },
        };

        var entity = new Parametrage();
        ApplyDto(entity, dto);
        return entity;
    }

    private static void ApplyCongesMaladieDto(Parametrage e, CongesMaladieDto dto)
    {
        e.MaladieTypesJson             = JsonSerializer.Serialize(dto.Types, JsonOpts);
        e.MaladieCertificatObligatoire = dto.Config.CertificatObligatoire;
        e.MaladieValidationRhOnly      = dto.Config.ValidationRhOnly;
        e.MaladieExclusionAssiduite    = dto.Config.ExclusionAssiduite;
    }

    private static CongesMaladieDto ToCongesMaladieDto(Parametrage e) => new()
    {
        Types  = JsonSerializer.Deserialize<List<MaladieTypeDto>>(e.MaladieTypesJson, JsonOpts) ?? new(),
        Config = new()
        {
            CertificatObligatoire = e.MaladieCertificatObligatoire,
            ValidationRhOnly      = e.MaladieValidationRhOnly,
            ExclusionAssiduite    = e.MaladieExclusionAssiduite,
        },
    };

    private static void ApplyPlagesHorairesDto(Parametrage e, PlagesHorairesDto dto)
    {
        e.HoraireMatinDebut      = dto.HoraireMatinDebut;
        e.HoraireMatinFin        = dto.HoraireMatinFin;
        e.HorairePauseDebut      = dto.HorairePauseDebut;
        e.HorairePauseFin        = dto.HorairePauseFin;
        e.HoraireApresMidiDebut  = dto.HoraireApresMidiDebut;
        e.HoraireApresMidiFin    = dto.HoraireApresMidiFin;
        e.HoraireEteActif        = dto.HoraireEteActif;
        e.HoraireEtePeriodeDebut = dto.HoraireEtePeriodeDebut;
        e.HoraireEtePeriodeFin   = dto.HoraireEtePeriodeFin;
        e.HoraireEtePlageDebut   = dto.HoraireEtePlageDebut;
        e.HoraireEtePlageFin     = dto.HoraireEtePlageFin;
        e.HoraireRamadanActif    = dto.HoraireRamadanActif;
    }

    private static PlagesHorairesDto ToPlagesHorairesDto(Parametrage e) => new()
    {
        HoraireMatinDebut      = e.HoraireMatinDebut,
        HoraireMatinFin        = e.HoraireMatinFin,
        HorairePauseDebut      = e.HorairePauseDebut,
        HorairePauseFin        = e.HorairePauseFin,
        HoraireApresMidiDebut  = e.HoraireApresMidiDebut,
        HoraireApresMidiFin    = e.HoraireApresMidiFin,
        HoraireEteActif        = e.HoraireEteActif,
        HoraireEtePeriodeDebut = e.HoraireEtePeriodeDebut,
        HoraireEtePeriodeFin   = e.HoraireEtePeriodeFin,
        HoraireEtePlageDebut   = e.HoraireEtePlageDebut,
        HoraireEtePlageFin     = e.HoraireEtePlageFin,
        HoraireRamadanActif    = e.HoraireRamadanActif,
    };

    private static void ApplyDto(Parametrage e, ParametrageDto dto)
    {
        e.PersonnelFieldsJson = JsonSerializer.Serialize(dto.PersonnelFields, JsonOpts);
        e.RolePermsJson       = JsonSerializer.Serialize(dto.RolePerms, JsonOpts);
        e.WorkflowStepsJson   = JsonSerializer.Serialize(dto.WorkflowSteps, JsonOpts);
        e.MaladieTypesJson    = JsonSerializer.Serialize(dto.MaladieTypes, JsonOpts);
        e.AssiduiteBaremeJson = JsonSerializer.Serialize(dto.Bareme, JsonOpts);
        e.NotificationsJson   = JsonSerializer.Serialize(dto.Notifications, JsonOpts);

        var c = dto.CongesConfig;
        e.CongesUniteJoursOuvres     = c.UniteJoursOuvres;
        e.CongesInclusionWeekend     = c.InclusionWeekend;
        e.CongesInclusionFeries      = c.InclusionFeries;
        e.CongesDebitApresValidation = c.DebitApresValidation;
        e.CongesSoldeMinimum         = c.SoldeMinimum;
        e.CongesDelaiDepot           = c.DelaiDepot;
        e.CongesMotifObligatoire     = c.MotifObligatoire;

        var a = dto.AutoriConfig;
        e.AutoriMatinDebut    = a.MatinDebut;
        e.AutoriMatinFin      = a.MatinFin;
        e.AutoriPauseDebut    = a.PauseDebut;
        e.AutoriPauseFin      = a.PauseFin;
        e.AutoriApremDebut    = a.ApremDebut;
        e.AutoriApremFin      = a.ApremFin;
        e.AutoriEteActif      = a.EteActif;
        e.AutoriEteDebut      = a.EteDebut;
        e.AutoriEteFin        = a.EteFin;
        e.AutoriEteHeureDebut = a.EteHeureDebut;
        e.AutoriEteHeureFin   = a.EteHeureFin;
        e.AutoriRamadanActif  = a.RamadanActif;
        e.AutoriRamadanDebut  = a.RamadanDebut;
        e.AutoriRamadanFin    = a.RamadanFin;
        e.AutoriDureeMaxPerso = a.DureeMaxPerso;
        e.AutoriBlocageAuto   = a.BlocageAuto;

        var m = dto.MaladieConfig;
        e.MaladieCertificatObligatoire = m.CertificatObligatoire;
        e.MaladieValidationRhOnly      = m.ValidationRhOnly;
        e.MaladieExclusionAssiduite    = m.ExclusionAssiduite;
    }

    private static ParametrageDto ToDto(Parametrage e) => new()
    {
        PersonnelFields = JsonSerializer.Deserialize<List<PersonnelFieldDto>>(e.PersonnelFieldsJson, JsonOpts) ?? new(),
        RolePerms       = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, bool>>>(e.RolePermsJson, JsonOpts) ?? new(),
        WorkflowSteps   = JsonSerializer.Deserialize<List<WorkflowStepDto>>(e.WorkflowStepsJson, JsonOpts) ?? new(),
        MaladieTypes    = JsonSerializer.Deserialize<List<MaladieTypeDto>>(e.MaladieTypesJson, JsonOpts) ?? new(),
        Bareme          = JsonSerializer.Deserialize<List<BaremeRowDto>>(e.AssiduiteBaremeJson, JsonOpts) ?? new(),
        Notifications   = JsonSerializer.Deserialize<List<NotificationConfigDto>>(e.NotificationsJson, JsonOpts) ?? new(),
        CongesConfig = new()
        {
            UniteJoursOuvres     = e.CongesUniteJoursOuvres,
            InclusionWeekend     = e.CongesInclusionWeekend,
            InclusionFeries      = e.CongesInclusionFeries,
            DebitApresValidation = e.CongesDebitApresValidation,
            SoldeMinimum         = e.CongesSoldeMinimum,
            DelaiDepot           = e.CongesDelaiDepot,
            MotifObligatoire     = e.CongesMotifObligatoire,
        },
        AutoriConfig = new()
        {
            MatinDebut    = e.AutoriMatinDebut,
            MatinFin      = e.AutoriMatinFin,
            PauseDebut    = e.AutoriPauseDebut,
            PauseFin      = e.AutoriPauseFin,
            ApremDebut    = e.AutoriApremDebut,
            ApremFin      = e.AutoriApremFin,
            EteActif      = e.AutoriEteActif,
            EteDebut      = e.AutoriEteDebut,
            EteFin        = e.AutoriEteFin,
            EteHeureDebut = e.AutoriEteHeureDebut,
            EteHeureFin   = e.AutoriEteHeureFin,
            RamadanActif  = e.AutoriRamadanActif,
            RamadanDebut  = e.AutoriRamadanDebut,
            RamadanFin    = e.AutoriRamadanFin,
            DureeMaxPerso = e.AutoriDureeMaxPerso,
            BlocageAuto   = e.AutoriBlocageAuto,
        },
        MaladieConfig = new()
        {
            CertificatObligatoire = e.MaladieCertificatObligatoire,
            ValidationRhOnly      = e.MaladieValidationRhOnly,
            ExclusionAssiduite    = e.MaladieExclusionAssiduite,
        },
    };
}

public class SauvegarderDto
{
    public string Section { get; set; } = "";
    public System.Text.Json.JsonElement Donnees { get; set; }
}
