// DemandeCongeService.cs
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.DTOs.Conge;
using rh_management_backend.Models;

namespace rh_management_backend.Services;

public class DemandeCongeService : IDemandeCongeService
{
    private readonly RhDbContext _db;

    public DemandeCongeService(RhDbContext db) => _db = db;

    public async Task<List<DemandeConge>> GetAllAsync(string? matricule, string? statut)
    {
        var q = _db.DemandesConges.AsQueryable();
        if (!string.IsNullOrEmpty(matricule)) q = q.Where(d => d.Matricule == matricule);
        if (!string.IsNullOrEmpty(statut)) q = q.Where(d => d.Statut == statut);
        return await q.OrderByDescending(d => d.CreatedAt).ToListAsync();
    }

    public async Task<DemandeConge?> GetByIdAsync(int id) =>
        await _db.DemandesConges.FindAsync(id);

    public async Task<(DemandeConge? result, string? error)> CreateAsync(CreateCongeDto dto)
    {
        // Récupérer l'employé depuis la BDD (auto-remplissage)
        var employe = await _db.Employes.FirstOrDefaultAsync(e => e.Matricule == dto.Matricule);
        if (employe == null)
            return (null, "Employé introuvable avec ce matricule.");

        // Nom du supérieur hiérarchique
        string supNom = string.Empty;
        if (!string.IsNullOrEmpty(employe.SuperieurHierarchiqueMatricule))
        {
            var sup = await _db.Employes
                .FirstOrDefaultAsync(e => e.Matricule == employe.SuperieurHierarchiqueMatricule);
            supNom = sup?.NomComplet ?? string.Empty;
        }

        // Validation des dates
        if (dto.DateFin < dto.DateDebut)
            return (null, "La date de fin doit être ≥ à la date de début.");

        bool demiJournee = (dto.TypeDuree ?? "").Contains("Demi", StringComparison.OrdinalIgnoreCase);
        if (demiJournee && dto.DateDebut != dto.DateFin)
            return (null, "Pour une demi-journée, les dates début et fin doivent être identiques.");

        if (!dto.EstBrouillon)
        {
            // Règle : min 3 jours ouvrés avant (cahier des charges)
            if (!IsMinThreeWorkingDays(dto.DateDebut))
                return (null, "La demande doit être déposée au minimum 3 jours ouvrés avant la date de début.");

            // Règle : solde suffisant
            int dureeCheck = ComputeDuree(dto.DateDebut, dto.DateFin, demiJournee);
            bool needsSolde = dto.TypeConge is not ("Congé sans solde" or "Congé maternité");
            if (needsSolde && dureeCheck > employe.SoldeConges)
                return (null, $"Solde insuffisant : {employe.SoldeConges} jours disponibles, {dureeCheck} demandés.");

            // Règle : motif obligatoire pour congés exceptionnels
            if (dto.TypeConge is "Congé exceptionnel de courte durée" or "Congé de décès"
                && string.IsNullOrWhiteSpace(dto.Motif))
                return (null, "Le motif est obligatoire pour ce type de congé.");
        }

        int dureeJours = ComputeDuree(dto.DateDebut, dto.DateFin, demiJournee);
        string statut = dto.EstBrouillon ? "Brouillon" : "En attente de validation N+1";

        var entity = new DemandeConge
        {
            Matricule = employe.Matricule,
            NomComplet = employe.NomComplet,
            Direction = employe.Direction,
            Service = employe.Service,
            GradeFonction = employe.Fonction,
            SuperieurHierarchique = supNom,
            TypeConge = dto.TypeConge,
            DateDebut = dto.DateDebut,
            DateFin = dto.DateFin,
            DureeJours = dureeJours,
            TypeDuree = dto.TypeDuree,
            Motif = dto.Motif,
            AdressePendantConge = dto.AdressePendantConge,
            Telephone = dto.Telephone,
            PieceJustificativeFichierNom = dto.PieceJustificativeFichierNom,
            Statut = statut,
            EstBrouillon = dto.EstBrouillon,
            CreatedAt = DateTime.UtcNow
        };

        _db.DemandesConges.Add(entity);
        await _db.SaveChangesAsync();

        await AddLog("conge", entity.Id, dto.EstBrouillon ? "Brouillon créé" : "Demande soumise",
                     employe.Matricule, "employe");

        return (entity, null);
    }

    // ── Workflow transitions ─────────────────────────────────────────────────

    public async Task<(bool success, string? error)> ValiderN1Async(int id, WorkflowActionDto action)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");
        if (d.Statut != "En attente de validation N+1")
            return (false, "Ce statut ne permet pas cette action.");

        d.Statut = "En attente de validation DG";
        d.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await AddLog("conge", id, "Validation N+1", action.AuteurMatricule, "n1", action.Commentaire);
        return (true, null);
    }

    public async Task<(bool success, string? error)> RejeterN1Async(int id, WorkflowActionDto action)
    {
        if (string.IsNullOrWhiteSpace(action.Commentaire))
            return (false, "Le motif de rejet est obligatoire.");
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");

        d.Statut = "Rejetée par le supérieur hiérarchique";
        d.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await AddLog("conge", id, "Rejet N+1", action.AuteurMatricule, "n1", action.Commentaire);
        return (true, null);
    }

    public async Task<(bool success, string? error)> ValiderDGAsync(int id, WorkflowActionDto action)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");
        if (d.Statut != "En attente de validation DG")
            return (false, "Ce statut ne permet pas cette action.");

        d.Statut = "Validée – En traitement RH";
        d.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await AddLog("conge", id, "Validation DG", action.AuteurMatricule, "dg", action.Commentaire);
        return (true, null);
    }

    public async Task<(bool success, string? error)> RejeterDGAsync(int id, WorkflowActionDto action)
    {
        if (string.IsNullOrWhiteSpace(action.Commentaire))
            return (false, "Le motif de rejet est obligatoire.");
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");

        d.Statut = "Rejetée par la Direction Générale";
        d.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await AddLog("conge", id, "Rejet DG", action.AuteurMatricule, "dg", action.Commentaire);
        return (true, null);
    }

    public async Task<(bool success, string? error)> CloturerRHAsync(int id, WorkflowActionDto action)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");
        if (d.Statut != "Validée – En traitement RH")
            return (false, "Ce statut ne permet pas cette action.");

        // Débit du solde de congés (cahier des charges)
        var employe = await _db.Employes.FirstOrDefaultAsync(e => e.Matricule == d.Matricule);
        if (employe != null)
            employe.SoldeConges = Math.Max(0, employe.SoldeConges - d.DureeJours);

        d.Statut = "Clôturée";
        d.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await AddLog("conge", id, "Clôture RH", action.AuteurMatricule, "rh", action.Commentaire);
        return (true, null);
    }

    public async Task<(bool success, string? error)> AnnulerAsync(int id, WorkflowActionDto action)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");
        if (d.Statut == "Clôturée")
            return (false, "Impossible d'annuler une demande clôturée.");

        d.Statut = "Annulée";
        d.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await AddLog("conge", id, "Annulation", action.AuteurMatricule, "employe", action.Commentaire);
        return (true, null);
    }

    public async Task<List<HistoriqueAction>> GetHistoriqueAsync(int id) =>
        await _db.HistoriqueActions
            .Where(h => h.TypeDemande == "conge" && h.DemandeId == id)
            .OrderBy(h => h.Timestamp)
            .ToListAsync();

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task AddLog(string type, int demandeId, string action,
                               string matricule, string role, string? commentaire = null)
    {
        _db.HistoriqueActions.Add(new HistoriqueAction
        {
            TypeDemande = type,
            DemandeId = demandeId,
            Action = action,
            AuteurMatricule = matricule,
            AuteurRole = role,
            Commentaire = commentaire,
            Timestamp = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }

    private static int ComputeDuree(DateOnly debut, DateOnly fin, bool demiJournee)
    {
        if (demiJournee) return 1;
        int days = 0;
        var cur = debut;
        while (cur <= fin) { days++; cur = cur.AddDays(1); }
        return days;
    }

    private static bool IsMinThreeWorkingDays(DateOnly dateDebut)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        int jours = 0;
        var cur = today.AddDays(1);
        while (jours < 3)
        {
            if (cur.DayOfWeek != DayOfWeek.Saturday && cur.DayOfWeek != DayOfWeek.Sunday)
                jours++;
            if (jours < 3) cur = cur.AddDays(1);
        }
        return dateDebut >= cur;
    }
}