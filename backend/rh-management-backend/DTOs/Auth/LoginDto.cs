using System.ComponentModel.DataAnnotations;

namespace rh_management_backend.DTOs.Auth;

public record LoginDto(
    [Required] string Matricule,
    [Required] string Password
);

public record LoginResponseDto(
    int Id,
    string Matricule,
    string Role,
    string Nom,
    string Prenom,
    string NomComplet,
    string Initiales,
    string Direction,
    string Service,
    string Fonction,
    int SoldeConges,
    string? SuperieurHierarchiqueMatricule,
    string Token,
    DateTime ExpiresAt,
    bool MustChangePassword
);

public record ChangePasswordDto(
    [Required] string CurrentPassword,
    [Required, MinLength(6)] string NewPassword
);