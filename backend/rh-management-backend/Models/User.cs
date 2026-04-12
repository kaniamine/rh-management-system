using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace rh_management_backend.Models;

/// <summary>
/// Rôles : employe | n1 | dg | rh | admin
/// </summary>
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
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(Employe))]
    public int EmployeId { get; set; }
    public Employe Employe { get; set; } = null!;
}