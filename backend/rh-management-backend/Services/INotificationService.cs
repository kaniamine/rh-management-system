using rh_management_backend.Models;

namespace rh_management_backend.Services;

public interface INotificationService
{
    Task CreerNotificationAsync(
        string destinataireMatricule,
        string destinataireRole,
        string typeDemande,
        int demandeId,
        string action,
        string message);

    Task<List<Notification>> GetNotificationsNonLuesAsync(string matricule);
    Task<List<Notification>> GetNotificationsParDemandeAsync(string typeDemande, int demandeId);
}
