namespace rh_management_backend.Models;

public class DemandeConge
{
    public int Id { get; set; }
    public string NomComplet { get; set; } = string.Empty;
    public string Matricule { get; set; } = string.Empty;
    public string? Service { get; set; }
    public string? SuperieurHierarchique { get; set; }
    public string? GradeFonction { get; set; }
    public string TypeConge { get; set; } = string.Empty;
    public string TypeDuree { get; set; } = "Journée entière";
    public DateOnly DateDebut { get; set; }
    public DateOnly DateFin { get; set; }
    public int DureeJours { get; set; }
    public string? Motif { get; set; }
    public string? MotifRejet { get; set; }   // ← AJOUTER
    public string? AdressePendantConge { get; set; }
    public string? Telephone { get; set; }
    public string? PieceJustificativeFichierNom { get; set; }
    public bool EstBrouillon { get; set; }
    public string Statut { get; set; } = "En attente";
    public DateTime CreatedAt { get; set; }
}