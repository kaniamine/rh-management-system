using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace rh_management_backend.Models;


public class User
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string Matricule { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Role { get; set; } = "employe";

    public bool IsActive { get; set; } = true;
    public bool MustChangePassword { get; set; } = true;

    // ← NOUVEAU : compteur de connexions
    public int NombreConnexions { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(Employe))]
    public int EmployeId { get; set; }
    public Employe Employe { get; set; } = null!;
}