using System.ComponentModel.DataAnnotations;

namespace rh_management_backend.DTOs.Autorisation;

public record CreateAutorisationDto(
    [Required] string Matricule,
    [Required] string TypeAutorisation,   // "Autorisation personnelle" | "Autorisation professionnelle"
    DateOnly DateDemande,
    TimeOnly? HeureSortie,
    TimeOnly? HeureRetour,
    [Required] string Motif,
    string? Commentaire,
    string? Destination,
    string? Telephone,
    bool EstBrouillon
);