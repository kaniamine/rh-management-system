using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;

namespace rh_management_backend.Services;

public class NotificationService : INotificationService
{
    private readonly RhDbContext _db;

    public NotificationService(RhDbContext db) => _db = db;

    public async Task CreerNotificationAsync(
        string destinataireMatricule,
        string destinataireRole,
        string typeDemande,
        int demandeId,
        string action,
        string message)
    {
        _db.Notifications.Add(new Notification
        {
            DestinataireMatricule = destinataireMatricule,
            DestinataireRole      = destinataireRole,
            TypeDemande           = typeDemande,
            DemandeId             = demandeId,
            Action                = action,
            Message               = message,
            IsRead                = false,
            Timestamp             = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }

    public async Task<List<Notification>> GetNotificationsNonLuesAsync(string matricule)
    {
        return await _db.Notifications
            .Where(n => n.DestinataireMatricule == matricule && !n.IsRead)
            .OrderByDescending(n => n.Timestamp)
            .ToListAsync();
    }

    public async Task<List<Notification>> GetNotificationsParDemandeAsync(string typeDemande, int demandeId)
    {
        return await _db.Notifications
            .Where(n => n.TypeDemande == typeDemande && n.DemandeId == demandeId)
            .OrderByDescending(n => n.Timestamp)
            .ToListAsync();
    }

    // ── Helpers pour retrouver les destinataires par rôle ────────────────────

    public async Task<List<string>> GetMatriculesByRoleAsync(string role)
    {
        return await _db.Users
            .Where(u => u.Role == role && u.IsActive)
            .Select(u => u.Matricule)
            .ToListAsync();
    }

    public async Task NotifierRoleAsync(
        string role,
        string typeDemande,
        int demandeId,
        string action,
        string message)
    {
        var matricules = await GetMatriculesByRoleAsync(role);
        foreach (var m in matricules)
        {
            _db.Notifications.Add(new Notification
            {
                DestinataireMatricule = m,
                DestinataireRole      = role,
                TypeDemande           = typeDemande,
                DemandeId             = demandeId,
                Action                = action,
                Message               = message,
                IsRead                = false,
                Timestamp             = DateTime.UtcNow
            });
        }
        await _db.SaveChangesAsync();
    }
}
