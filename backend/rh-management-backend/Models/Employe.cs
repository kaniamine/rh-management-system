using System.ComponentModel.DataAnnotations;

namespace rh_management_backend.Models;

public class Employe
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string Matricule { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Nom { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Prenom { get; set; } = string.Empty;

    public string NomComplet => $"{Prenom} {Nom}";

    [Required, MaxLength(150)]
    public string Direction { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Service { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Fonction { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? SuperieurHierarchiqueMatricule { get; set; }

    public int SoldeConges { get; set; } = 30;
    public int AutorisationsUtiliseesMois { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
}