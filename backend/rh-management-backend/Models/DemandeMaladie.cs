using System.ComponentModel.DataAnnotations;

namespace rh_management_backend.Models;

public class DemandeMaladie
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

    // "Maladie simple" | "Congé maternité" | "Congé pour chirurgie"
    [Required, MaxLength(80)]
    public string TypeMaladie { get; set; } = string.Empty;

    public DateOnly DateDebut { get; set; }
    public DateOnly DateFin { get; set; }
    public int NombreJours { get; set; }

    // true pour maternité et chirurgie (exemptés du barème d'assiduité)
    public bool ExempteAssiduité { get; set; } = false;

    // Obligatoire — nom du fichier uploadé
    public string? CertificatMedicalFichierNom { get; set; }
    public string? Commentaire { get; set; }

    // Statuts : Brouillon | En attente de validation RH | Validée | Rejetée | Annulée
    [Required, MaxLength(100)]
    public string Statut { get; set; } = "Brouillon";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}