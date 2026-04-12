using System.ComponentModel.DataAnnotations;

namespace rh_management_backend.Models;

public class HistoriqueAction
{
    public int Id { get; set; }

    // "conge" | "autorisation" | "maladie"
    [Required, MaxLength(30)]
    public string TypeDemande { get; set; } = string.Empty;

    public int DemandeId { get; set; }

    // "Création" | "Soumission" | "Validation N+1" | "Rejet N+1" |
    // "Validation DG" | "Rejet DG" | "Clôture RH" | "Annulation" | "Modification"
    [Required, MaxLength(80)]
    public string Action { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string AuteurMatricule { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string AuteurRole { get; set; } = string.Empty;

    public string? Commentaire { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}