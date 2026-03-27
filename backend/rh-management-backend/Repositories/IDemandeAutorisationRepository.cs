using System.Collections.Generic;
using System.Threading.Tasks;
using rh_management_backend.Models;

namespace rh_management_backend.Repositories;

public interface IDemandeAutorisationRepository
{
    Task<IEnumerable<DemandeAutorisation>> GetAllDemandeAutorisationAsync();
    Task<DemandeAutorisation> GetDemandeAutorisationByIdAsync(int id);
    Task AddDemandeAutorisationAsync(DemandeAutorisation demandeAutorisation);
    Task UpdateDemandeAutorisationAsync(DemandeAutorisation demandeAutorisation);
    Task DeleteDemandeAutorisationAsync(int id);
}