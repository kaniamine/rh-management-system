namespace rh_management_backend.Models;

public class Employe
{
    public int Id { get; set; }
    public string Matricule { get; set; } = string.Empty;
    public string NomComplet { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string? Service { get; set; }
    public string? Direction { get; set; }
    public string? Fonction { get; set; }
    public string? SuperieurHierarchique { get; set; }
    public string? SuperieurHierarchiqueMatricule { get; set; }
    public int SoldeCongesJours { get; set; } = 30;
    public int SoldeConges { get; set; } = 30;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}