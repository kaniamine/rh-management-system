using System.ComponentModel.DataAnnotations;

namespace rh_management_backend.DTOs.Maladie;

public record CreateMaladieDto(
    [Required] string Matricule,
    [Required] string TypeMaladie,    // "Maladie simple" | "Congé maternité" | "Congé pour chirurgie"
    DateOnly DateDebut,
    DateOnly DateFin,
    string? CertificatMedicalFichierNom,  // obligatoire pour soumission
    string? Commentaire,
    bool EstBrouillon
);