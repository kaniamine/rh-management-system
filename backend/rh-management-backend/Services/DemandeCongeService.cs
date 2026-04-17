using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.DTOs.Conge;
using rh_management_backend.Models;

namespace rh_management_backend.Services;

public class DemandeCongeService : IDemandeCongeService
{
    private readonly RhDbContext _db;

    public DemandeCongeService(RhDbContext db) => _db = db;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static bool EstCongeSansSolde(string typeConge) =>
        typeConge.Contains("maladie", StringComparison.OrdinalIgnoreCase) ||
        typeConge.Contains("maternité", StringComparison.OrdinalIgnoreCase) ||
        typeConge.Contains("chirurgie", StringComparison.OrdinalIgnoreCase) ||
        typeConge.Contains("sans solde", StringComparison.OrdinalIgnoreCase);

    private static int ComputeDureeJours(DateOnly debut, DateOnly fin, bool demiJournee)
    {
        var jours = fin.DayNumber - debut.DayNumber + 1;
        if (jours < 1) return 0;
        return demiJournee ? 1 : jours;
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
            // type = "maladie" | "conge" | "autorisation"
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
        // Structure extensible — retourne le statut actuel pour l'instant
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

        var typeDuree = string.IsNullOrWhiteSpace(dto.TypeDuree) ? "Journée entière" : dto.TypeDuree.Trim();
        var demiJournee = typeDuree.Contains("Demi", StringComparison.OrdinalIgnoreCase);

        if (!dto.EstBrouillon)
        {
            if (string.IsNullOrWhiteSpace(dto.Matricule))
                return (null, "Le matricule est obligatoire.");

            if (string.IsNullOrWhiteSpace(dto.Motif))
                return (null, "Le motif est obligatoire pour soumettre la demande.");
        }

        var dureeJours = ComputeDureeJours(dto.DateDebut, dto.DateFin, demiJournee);
        if (dureeJours < 1)
            return (null, "Durée invalide.");

        // Vérification du solde (sauf congés sans solde / maladie)
        if (!dto.EstBrouillon && !EstCongeSansSolde(dto.TypeConge) && !string.IsNullOrWhiteSpace(dto.Matricule))
        {
            var employe = await _db.Employes.FirstOrDefaultAsync(e => e.Matricule == dto.Matricule);
            if (employe != null && employe.SoldeCongesJours < dureeJours)
                return (null, $"Solde insuffisant : vous demandez {dureeJours} jours mais votre solde est de {employe.SoldeCongesJours} jours.");
        }

        var entity = new DemandeConge
        {
            NomComplet = dto.Matricule ?? "",   // sera résolu via l'employé en prod
            Matricule = (dto.Matricule ?? "").Trim(),
            Service = null,
            SuperieurHierarchique = null,
            GradeFonction = null,
            TypeConge = dto.TypeConge.Trim(),
            TypeDuree = typeDuree,
            DateDebut = dto.DateDebut,
            DateFin = dto.DateFin,
            DureeJours = dureeJours,
            Motif = string.IsNullOrWhiteSpace(dto.Motif) ? null : dto.Motif.Trim(),
            AdressePendantConge = string.IsNullOrWhiteSpace(dto.AdressePendantConge) ? null : dto.AdressePendantConge.Trim(),
            Telephone = string.IsNullOrWhiteSpace(dto.Telephone) ? null : dto.Telephone.Trim(),
            PieceJustificativeFichierNom = string.IsNullOrWhiteSpace(dto.PieceJustificativeFichierNom) ? null : dto.PieceJustificativeFichierNom.Trim(),
            EstBrouillon = dto.EstBrouillon,
            Statut = dto.EstBrouillon ? "Brouillon" : "En attente de validation N+1",
            CreatedAt = DateTime.UtcNow
        };

        _db.DemandesConges.Add(entity);
        await _db.SaveChangesAsync();
        return (entity, null);
    }

    // ── Workflow ──────────────────────────────────────────────────────────────

    public async Task<(bool ok, string? err)> ValiderN1Async(int id, WorkflowActionDto action)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");
        if (d.Statut != "En attente de validation N+1")
            return (false, $"Statut incorrect : {d.Statut}");

        d.Statut = "En attente de validation DG";
        await _db.SaveChangesAsync();
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

        // ✅ Rejet N+1 → solde INCHANGÉ (cahier des charges)
        d.Statut = "Rejetée par le supérieur hiérarchique";
        await _db.SaveChangesAsync();
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

        // ✅ Rejet DG → solde INCHANGÉ (cahier des charges)
        d.Statut = "Rejetée par la Direction Générale";
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool ok, string? err)> CloturerRHAsync(int id, WorkflowActionDto action)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");

        if (d.Statut != "Validée – En traitement RH" && d.Statut != "Validée")
            return (false, $"Impossible de clôturer une demande au statut : {d.Statut}");

        // ✅ Débit du solde — sauf maladie/maternité/chirurgie/sans solde
        bool estExempte =
            d.TypeConge.Contains("maladie", StringComparison.OrdinalIgnoreCase) ||
            d.TypeConge.Contains("maternit", StringComparison.OrdinalIgnoreCase) ||
            d.TypeConge.Contains("chirurgie", StringComparison.OrdinalIgnoreCase) ||
            d.TypeConge.Contains("sans solde", StringComparison.OrdinalIgnoreCase);

        if (!estExempte)
        {
            var employe = await _db.Employes
                .FirstOrDefaultAsync(e => e.Matricule == d.Matricule);

            if (employe != null)
            {
                // Utiliser les deux champs pour rester compatible
                employe.SoldeConges = Math.Max(0, employe.SoldeConges - d.DureeJours);
                employe.SoldeCongesJours = employe.SoldeConges;
            }
        }

        d.Statut = "Clôturée";
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool ok, string? err)> UpdateStatutAsync(int id, UpdateStatutDto dto)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        if (d == null) return (false, "Demande introuvable.");

        // ✅ REJETER via PATCH statut → solde INCHANGÉ (cahier des charges)
        // Le solde n'est jamais modifié ici, quelle que soit la valeur du statut
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

        // ✅ Annulation → solde INCHANGÉ (cahier des charges)
        d.Statut = "Annulée";
        await _db.SaveChangesAsync();
        return (true, null);
    }
}