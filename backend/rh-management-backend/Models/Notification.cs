using System.ComponentModel.DataAnnotations;

namespace rh_management_backend.Models;

public class Notification
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string DestinataireMatricule { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}