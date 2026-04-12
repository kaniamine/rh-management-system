using System.ComponentModel.DataAnnotations;

namespace rh_management_backend.DTOs.Conge;

public record CreateCongeDto(
    [Required] string Matricule,
    [Required] string TypeConge,
    DateOnly DateDebut,
    DateOnly DateFin,
    bool EstBrouillon,
    string? TypeDuree,
    string? Motif,
    string? AdressePendantConge,
    string? Telephone,
    string? PieceJustificativeFichierNom
);

public record CongeResponseDto(
    int Id,
    string Matricule,
    string NomComplet,
    string Direction,
    string Service,
    string TypeConge,
    DateOnly DateDebut,
    DateOnly DateFin,
    int DureeJours,
    string Statut,
    DateTime CreatedAt
);

public record WorkflowActionDto(
    [Required] string AuteurMatricule,
    string? Commentaire
);