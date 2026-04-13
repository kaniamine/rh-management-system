using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly RhDbContext _db;
    public NotificationController(RhDbContext db) => _db = db;

    // GET /api/notifications?matricule=EMP001
    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] string matricule)
    {
        var list = await _db.Notifications
            .Where(n => n.DestinataireMatricule == matricule)
            .OrderByDescending(n => n.Timestamp)
            .Take(20)
            .ToListAsync();
        return Ok(list);
    }

    // GET /api/notifications/count?matricule=EMP001
    [HttpGet("count")]
    public async Task<IActionResult> GetCount([FromQuery] string matricule)
    {
        var count = await _db.Notifications
            .CountAsync(n => n.DestinataireMatricule == matricule && !n.IsRead);
        return Ok(new { count });
    }

    // POST /api/notifications/{id}/lire
    [HttpPost("{id}/lire")]
    public async Task<IActionResult> MarquerLue(int id)
    {
        var n = await _db.Notifications.FindAsync(id);
        if (n == null) return NotFound();
        n.IsRead = true;
        await _db.SaveChangesAsync();
        return Ok();
    }

    // POST /api/notifications/lire-toutes?matricule=EMP001
    [HttpPost("lire-toutes")]
    public async Task<IActionResult> MarquerToutesLues([FromQuery] string matricule)
    {
        var notifs = await _db.Notifications
            .Where(n => n.DestinataireMatricule == matricule && !n.IsRead)
            .ToListAsync();
        notifs.ForEach(n => n.IsRead = true);
        await _db.SaveChangesAsync();
        return Ok(new { marked = notifs.Count });
    }
}