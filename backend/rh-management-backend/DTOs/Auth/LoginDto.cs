using System.ComponentModel.DataAnnotations;

namespace rh_management_backend.DTOs.Auth;

public record LoginDto(
    [Required] string Matricule,
    [Required] string Password
);

public record LoginResponseDto(
    string Matricule,
    string Role,
    string NomComplet,
    string Initiales,
    string Direction,
    string Service,
    string Fonction,
    int SoldeConges,
    string? SuperieurHierarchiqueMatricule,
    string Token,
    DateTime ExpiresAt
);