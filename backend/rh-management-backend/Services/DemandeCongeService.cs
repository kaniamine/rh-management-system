using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.DTOs.Conge;
using rh_management_backend.DTOs.Parametrage;
using rh_management_backend.Models;

namespace rh_management_backend.Services;

public class DemandeCongeService : IDemandeCongeService
{
    private readonly RhDbContext _db;
    private readonly NotificationService _notif;

    public DemandeCongeService(RhDbContext db, INotificationService notif)
    {
        _db   = db;
        _notif = (NotificationService)notif;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static bool EstCongeSansSolde(string typeConge) =>
        typeConge.Contains("maladie",    StringComparison.OrdinalIgnoreCase) ||
        typeConge.Contains("maternité",  StringComparison.OrdinalIgnoreCase) ||
        typeConge.Contains("chirurgie",  StringComparison.OrdinalIgnoreCase) ||
        typeConge.Contains("sans solde", StringComparison.OrdinalIgnoreCase);

    private static int ComputeDureeJours(DateOnly debut, DateOnly fin, bool demiJournee)
    {
        var jours = fin.DayNumber - debut.DayNumber + 1;
        if (jours < 1) return 0;
        return demiJournee ? 1 : jours;
    }

    // ── Workflow config ───────────────────────────────────────────────────────

    private async Task<(bool shActif, bool dgActif)> GetWorkflowConfig()
    {
        var config = await _db.Parametrages.AsNoTracking().FirstOrDefaultAsync();
        if (config == null) return (true, true);

        var steps = JsonSerializer.Deserialize<List<WorkflowStepDto>>(
            config.WorkflowStepsJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        ) ?? new();

        bool shActif = steps.Count > 1 && steps[1].Active;
        bool dgActif = steps.Count > 2 && steps[2].Active;

        return (shActif, dgActif);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public async Task<List<DemandeConge>> GetAllAsync(string? matricule, string? statut, string? type)
    {
        var q = _db.DemandesConges.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(matricule))
            q = q.Where(d => d.Matricule == matricule.Trim());

        if (!string.IsNullOrWhiteSpace(statut))
            q = q.Where(d => d.Statut == statut.Trim());

        if (!string.IsNullOrWhiteSpace(type))
        {
            if (type == "maladie")
                q = q.Where(d => d.TypeConge.Contains("maladie") || d.TypeConge.Contains("maternité") || d.TypeConge.Contains("chirurgie"));
            else if (type == "conge")
                q = q.Where(d => !d.TypeConge.Contains("maladie") && !d.TypeConge.Contains("maternité") && !d.TypeConge.Contains("chirurgie"));
        }

        return await q.OrderByDescending(d => d.CreatedAt).ToListAsync();
    }

    public async Task<DemandeConge?> GetByIdAsync(int id) =>
        await _db.DemandesConges.FindAsync(id);

    public async Task<List<object>> GetHistoriqueAsync(int id)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return [];
        return [new { action = "Statut courant", statut = d.Statut, date = d.CreatedAt }];
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public async Task<(DemandeConge? result, string? error)> CreateAsync(CreateCongeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.TypeConge))
            return (null, "Le type de congé est obligatoire.");

        if (dto.DateFin < dto.DateDebut)
            return (null, "La date de fin doit être postérieure ou égale à la date de début.");

        var typeDuree  = string.IsNullOrWhiteSpace(dto.TypeDuree) ? "Journée entière" : dto.TypeDuree.Trim();
        var demiJournee = typeDuree.Contains("Demi", StringComparison.OrdinalIgnoreCase);

        if (!dto.EstBrouillon && string.IsNullOrWhiteSpace(dto.Matricule))
            return (null, "Le matricule est obligatoire.");

        var dureeJours = ComputeDureeJours(dto.DateDebut, dto.DateFin, demiJournee);
        if (dureeJours < 1)
            return (null, "Durée invalide.");

        // Résolution des infos employé
        Employe? employe = null;
        if (!string.IsNullOrWhiteSpace(dto.Matricule))
            employe = await _db.Employes.FirstOrDefaultAsync(e => e.Matricule == dto.Matricule.Trim());

        // Vérification du solde (sauf congés sans solde / maladie)
        if (!dto.EstBrouillon && !EstCongeSansSolde(dto.TypeConge) && employe != null)
        {
            if (employe.SoldeCongesJours < dureeJours)
                return (null, $"Solde insuffisant : vous demandez {dureeJours} jours mais votre solde est de {employe.SoldeCongesJours} jours.");
        }

        string statutInitial;
        if (dto.EstBrouillon)
        {
            statutInitial = "Brouillon";
        }
        else
        {
            var (shActif, dgActif) = await GetWorkflowConfig();
            statutInitial = shActif
                ? "En attente de validation N+1"
                : dgActif
                    ? "En attente de validation DG"
                    : "Validée – En traitement RH";
        }

        var entity = new DemandeConge
        {
            NomComplet             = employe?.NomComplet ?? dto.Matricule ?? "",
            Matricule              = (dto.Matricule ?? "").Trim(),
            Service                = employe?.Service,
            SuperieurHierarchique  = employe?.SuperieurHierarchique,
            GradeFonction          = employe?.Fonction,
            TypeConge              = dto.TypeConge.Trim(),
            TypeDuree              = typeDuree,
            DateDebut              = dto.DateDebut,
            DateFin                = dto.DateFin,
            DureeJours             = dureeJours,
            Motif                  = string.IsNullOrWhiteSpace(dto.Motif) ? null : dto.Motif.Trim(),
            AdressePendantConge    = string.IsNullOrWhiteSpace(dto.AdressePendantConge) ? null : dto.AdressePendantConge.Trim(),
            Telephone              = string.IsNullOrWhiteSpace(dto.Telephone) ? null : dto.Telephone.Trim(),
            PieceJustificativeFichierNom = string.IsNullOrWhiteSpace(dto.PieceJustificativeFichierNom) ? null : dto.PieceJustificativeFichierNom.Trim(),
            EstBrouillon           = dto.EstBrouillon,
            Statut                 = statutInitial,
            CreatedAt              = DateTime.UtcNow
        };

        _db.DemandesConges.Add(entity);
        await _db.SaveChangesAsync();

        // Notification soumission → N+1
        if (!dto.EstBrouillon && employe?.SuperieurHierarchiqueMatricule != null)
        {
            await _notif.CreerNotificationAsync(
                employe.SuperieurHierarchiqueMatricule,
                "n1", "conge", entity.Id, "soumission",
                $"Une nouvelle demande de congé de {entity.NomComplet} est en attente de votre validation.");
        }

        return (entity, null);
    }

    // ── Workflow ──────────────────────────────────────────────────────────────

    public async Task<(bool ok, string? err)> ValiderN1Async(int id, WorkflowActionDto action)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");
        if (d.Statut != "En attente de validation N+1")
            return (false, $"Statut incorrect : {d.Statut}");

        var (_, dgActif) = await GetWorkflowConfig();
        d.Statut = dgActif ? "En attente de validation DG" : "Validée – En traitement RH";
        await _db.SaveChangesAsync();

        if (dgActif)
        {
            await _notif.NotifierRoleAsync("dg", "conge", id, "validation",
                $"La demande de congé de {d.NomComplet} a été validée par le supérieur hiérarchique et attend votre validation.");
        }
        else
        {
            await _notif.NotifierRoleAsync("rh", "conge", id, "validation",
                $"La demande de congé de {d.NomComplet} a été validée par le supérieur hiérarchique et est en attente de traitement RH.");
        }

        return (true, null);
    }

    public async Task<(bool ok, string? err)> RejeterN1Async(int id, WorkflowActionDto action)
    {
        if (string.IsNullOrWhiteSpace(action.Commentaire))
            return (false, "Le motif de rejet est obligatoire.");

        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");
        if (d.Statut != "En attente de validation N+1")
            return (false, $"Statut incorrect : {d.Statut}");

        d.Statut = "Rejetée par le supérieur hiérarchique";
        await _db.SaveChangesAsync();

        // Notification → employé
        await _notif.CreerNotificationAsync(
            d.Matricule, "employe", "conge", id, "rejet",
            $"Votre demande de congé a été rejetée par votre supérieur hiérarchique. Motif : {action.Commentaire}");

        return (true, null);
    }

    public async Task<(bool ok, string? err)> ValiderDGAsync(int id, WorkflowActionDto action)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");
        if (d.Statut != "En attente de validation DG")
            return (false, $"Statut incorrect : {d.Statut}");

        d.Statut = "Validée – En traitement RH";
        await _db.SaveChangesAsync();

        // Notification → RH
        await _notif.NotifierRoleAsync("rh", "conge", id, "validation",
            $"La demande de congé de {d.NomComplet} a été validée par la Direction Générale et est en attente de traitement RH.");

        return (true, null);
    }

    public async Task<(bool ok, string? err)> RejeterDGAsync(int id, WorkflowActionDto action)
    {
        if (string.IsNullOrWhiteSpace(action.Commentaire))
            return (false, "Le motif de rejet est obligatoire.");

        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");
        if (d.Statut != "En attente de validation DG")
            return (false, $"Statut incorrect : {d.Statut}");

        d.Statut = "Rejetée par la Direction Générale";
        await _db.SaveChangesAsync();

        // Notification → employé
        await _notif.CreerNotificationAsync(
            d.Matricule, "employe", "conge", id, "rejet",
            $"Votre demande de congé a été rejetée par la Direction Générale. Motif : {action.Commentaire}");

        // Notification → N+1 (l'avait validée)
        var employe = await _db.Employes.FirstOrDefaultAsync(e => e.Matricule == d.Matricule);
        if (employe?.SuperieurHierarchiqueMatricule != null)
        {
            await _notif.CreerNotificationAsync(
                employe.SuperieurHierarchiqueMatricule,
                "n1", "conge", id, "rejet",
                $"La demande de congé de {d.NomComplet} que vous avez validée a été rejetée par la Direction Générale.");
        }

        return (true, null);
    }

    public async Task<(bool ok, string? err)> CloturerRHAsync(int id, WorkflowActionDto action)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");

        if (d.Statut != "Validée – En traitement RH" && d.Statut != "Validée")
            return (false, $"Impossible de clôturer une demande au statut : {d.Statut}");

        bool estExempte =
            d.TypeConge.Contains("maladie",    StringComparison.OrdinalIgnoreCase) ||
            d.TypeConge.Contains("maternit",   StringComparison.OrdinalIgnoreCase) ||
            d.TypeConge.Contains("chirurgie",  StringComparison.OrdinalIgnoreCase) ||
            d.TypeConge.Contains("sans solde", StringComparison.OrdinalIgnoreCase);

        if (!estExempte)
        {
            var employe = await _db.Employes.FirstOrDefaultAsync(e => e.Matricule == d.Matricule);
            if (employe != null)
            {
                employe.SoldeConges      = Math.Max(0, employe.SoldeConges - d.DureeJours);
                employe.SoldeCongesJours = employe.SoldeConges;
            }
        }

        d.Statut = "Clôturée";
        await _db.SaveChangesAsync();

        // Notification → employé
        await _notif.CreerNotificationAsync(
            d.Matricule, "employe", "conge", id, "cloture",
            "Votre demande de congé a été traitée et clôturée par la Direction RH. Votre solde a été mis à jour.");

        return (true, null);
    }

    public async Task<(bool ok, string? err)> UpdateStatutAsync(int id, UpdateStatutDto dto)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");
        d.Statut = dto.Statut;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool ok, string? err)> AnnulerAsync(int id, WorkflowActionDto action)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");

        var annulables = new[] { "Brouillon", "En attente de validation N+1", "En attente de validation DG" };
        if (!annulables.Contains(d.Statut))
            return (false, $"Impossible d'annuler une demande au statut : {d.Statut}");

        var statutAvant = d.Statut;
        d.Statut = "Annulée";
        await _db.SaveChangesAsync();

        var employe = await _db.Employes.FirstOrDefaultAsync(e => e.Matricule == d.Matricule);

        // Notifier le N+1 si la demande lui était déjà parvenue
        if (statutAvant != "Brouillon" && employe?.SuperieurHierarchiqueMatricule != null)
        {
            await _notif.CreerNotificationAsync(
                employe.SuperieurHierarchiqueMatricule,
                "n1", "conge", id, "annulation",
                $"La demande de congé de {d.NomComplet} a été annulée.");
        }

        // Notifier la DG si la demande lui était parvenue
        if (statutAvant == "En attente de validation DG")
        {
            await _notif.NotifierRoleAsync("dg", "conge", id, "annulation",
                $"La demande de congé de {d.NomComplet} a été annulée.");
        }

        return (true, null);
    }
}
