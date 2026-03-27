namespace rh_management_backend.Models;

public class DemandeAutorisation
{
    public int Id { get; set; }
    public string NomComplet { get; set; } = string.Empty;
    public string Matricule { get; set; } = string.Empty;
    public string? GradeFonction { get; set; }
    public string TypeAutorisation { get; set; } = string.Empty;
    public DateOnly DateDemande { get; set; }
    public TimeOnly? HeureSortie { get; set; }
    public TimeOnly? HeureRetour { get; set; }
    public string? Motif { get; set; }
    public string? Destination { get; set; }
    public string? Telephone { get; set; }
    public string Statut { get; set; } = "En attente";
    public DateTime CreatedAt { get; set; }
}