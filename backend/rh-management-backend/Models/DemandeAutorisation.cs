using System.ComponentModel.DataAnnotations;

namespace rh_management_backend.Models;

public class DemandeAutorisation
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string Matricule { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string NomComplet { get; set; } = string.Empty;

    [MaxLength(150)]
    public string Direction { get; set; } = string.Empty;

    [MaxLength(150)]
    public string Service { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? GradeFonction { get; set; }

    [MaxLength(200)]
    public string SuperieurHierarchique { get; set; } = string.Empty;

    // "Autorisation personnelle" | "Autorisation professionnelle"
    [Required, MaxLength(80)]
    public string TypeAutorisation { get; set; } = string.Empty;

    public DateOnly DateDemande { get; set; }
    public TimeOnly? HeureSortie { get; set; }
    public TimeOnly? HeureRetour { get; set; }
    public int? DureeMinutes { get; set; }  // calculé automatiquement

    [Required]
    public string Motif { get; set; } = string.Empty;  // obligatoire

    public string? Commentaire { get; set; }
    public string? Destination { get; set; }

    [MaxLength(20)]
    public string? Telephone { get; set; }

    // Statuts : Brouillon | En attente de validation du supérieur hiérarchique | Validée | Rejetée | Annulée
    [Required, MaxLength(100)]
    public string Statut { get; set; } = "Brouillon";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}