// IDemandeCongeService.cs
using rh_management_backend.DTOs.Conge;
using rh_management_backend.Models;

namespace rh_management_backend.Services;

public interface IDemandeCongeService
{
    Task<List<DemandeConge>> GetAllAsync(string? matricule = null, string? statut = null);
    Task<DemandeConge?> GetByIdAsync(int id);
    Task<(DemandeConge? result, string? error)> CreateAsync(CreateCongeDto dto);
    Task<(bool success, string? error)> ValiderN1Async(int id, WorkflowActionDto action);
    Task<(bool success, string? error)> RejeterN1Async(int id, WorkflowActionDto action);
    Task<(bool success, string? error)> ValiderDGAsync(int id, WorkflowActionDto action);
    Task<(bool success, string? error)> RejeterDGAsync(int id, WorkflowActionDto action);
    Task<(bool success, string? error)> CloturerRHAsync(int id, WorkflowActionDto action);
    Task<(bool success, string? error)> AnnulerAsync(int id, WorkflowActionDto action);
    Task<List<HistoriqueAction>> GetHistoriqueAsync(int id);
}