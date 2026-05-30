using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace rh_management_backend.Models;

public class Pointage
{
    public int Id { get; set; }

    [ForeignKey(nameof(User))]
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime Date { get; set; }

    public DateTime? HeureEntree { get; set; }
    public DateTime? HeureSortie { get; set; }
    public DateTime? DernierHeartbeat { get; set; }

    // Durée en minutes calculée à la sortie (ou via heartbeat)
    public int? DureeMinutes { get; set; }

    // Retard en minutes par rapport à l'heure réglementaire (08:30)
    public int? RetardMinutes { get; set; }

    [MaxLength(30)]
    public string Statut { get; set; } = "Absent";
}
