using rh_management_backend.DTOs.Conge;
using rh_management_backend.Models;

namespace rh_management_backend.Services;

public interface IDemandeCongeService
{
    Task<List<DemandeConge>> GetAllAsync(string? matricule, string? statut, string? type);
    Task<DemandeConge?> GetByIdAsync(int id);
    Task<(DemandeConge? result, string? error)> CreateAsync(CreateCongeDto dto);
    Task<List<object>> GetHistoriqueAsync(int id);

    Task<(bool ok, string? err)> ValiderN1Async(int id, WorkflowActionDto action);
    Task<(bool ok, string? err)> RejeterN1Async(int id, WorkflowActionDto action);
    Task<(bool ok, string? err)> ValiderDGAsync(int id, WorkflowActionDto action);
    Task<(bool ok, string? err)> RejeterDGAsync(int id, WorkflowActionDto action);

    /// <summary>
    /// Clôture la demande ET déduit le solde de congés de l'employé (selon cahier des charges).
    /// Ne déduit PAS pour les congés maladie/maternité/chirurgie.
    /// </summary>
    Task<(bool ok, string? err)> CloturerRHAsync(int id, WorkflowActionDto action);

    /// <summary>
    /// Rejette la demande — aucun impact sur le solde (selon cahier des charges).
    /// </summary>
    Task<(bool ok, string? err)> UpdateStatutAsync(int id, UpdateStatutDto dto);
    Task<(bool ok, string? err)> AnnulerAsync(int id, WorkflowActionDto action);
}