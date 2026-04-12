using System.ComponentModel.DataAnnotations;

namespace rh_management_backend.Models;

public class DemandeConge
{
    public int Id { get; set; }

    // Données employé — remplies automatiquement depuis la BDD
    [Required, MaxLength(20)]
    public string Matricule { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string NomComplet { get; set; } = string.Empty;

    [MaxLength(150)]
    public string Direction { get; set; } = string.Empty;

    [MaxLength(150)]
    public string Service { get; set; } = string.Empty;

    [MaxLength(150)]
    public string GradeFonction { get; set; } = string.Empty;

    [MaxLength(200)]
    public string SuperieurHierarchique { get; set; } = string.Empty;

    // Formulaire
    [Required, MaxLength(100)]
    public string TypeConge { get; set; } = string.Empty;

    public DateOnly DateDebut { get; set; }
    public DateOnly DateFin { get; set; }
    public int DureeJours { get; set; }

    [MaxLength(50)]
    public string? TypeDuree { get; set; }  // "Journée entière" | "Demi-journée matin" | "Demi-journée après-midi"

    public string? Motif { get; set; }
    public string? AdressePendantConge { get; set; }

    [MaxLength(20)]
    public string? Telephone { get; set; }
    public string? PieceJustificativeFichierNom { get; set; }

    // Workflow — Statuts (cahier des charges) :
    // Brouillon
    // En attente de validation N+1
    // Rejetée par le supérieur hiérarchique
    // En attente de validation DG
    // Rejetée par la Direction Générale
    // Validée – En traitement RH
    // Clôturée
    // Annulée
    [Required, MaxLength(100)]
    public string Statut { get; set; } = "Brouillon";

    public bool EstBrouillon { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}