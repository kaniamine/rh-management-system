using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

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
    bool MustChangePassword,
    int NombreConnexions
);

public class ChangePasswordDto
{
    [JsonPropertyName("ancienMotDePasse")]
    public string? AncienMotDePasse { get; set; }

    [JsonPropertyName("mot_de_passe_actuel")]
    public string? MotDePasseActuel { get; set; }

    [JsonPropertyName("nouveau_mot_de_passe")]
    public string? NouveauMotDePasseSnake { get; set; }

    [JsonPropertyName("nouveauMotDePasse")]
    public string? NouveauMotDePasse { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public string CurrentPassword =>
        AncienMotDePasse ??
        MotDePasseActuel ??
        string.Empty;

    [System.Text.Json.Serialization.JsonIgnore]
    public string NewPassword =>
        NouveauMotDePasseSnake ??
        NouveauMotDePasse ??
        string.Empty;
}
