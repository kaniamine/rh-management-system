using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using rh_management_backend.Services;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/pointage")]
[Authorize]
public class PointageController : ControllerBase
{
    private readonly IPointageService _svc;
    public PointageController(IPointageService svc) => _svc = svc;

    private string Matricule =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException();

    // GET /api/pointage/mon-historique
    [HttpGet("mon-historique")]
    public async Task<IActionResult> MonHistorique()
    {
        var list = await _svc.GetMonHistoriqueAsync(Matricule);
        return Ok(list);
    }

    // GET /api/pointage/aujourd-hui
    [HttpGet("aujourd-hui")]
    public async Task<IActionResult> Aujourdhui()
    {
        var dto = await _svc.GetAujourdhuiAsync(Matricule);
        return Ok(dto);
    }

    // POST /api/pointage/entree
    [HttpPost("entree")]
    public async Task<IActionResult> PointerEntree()
    {
        try
        {
            var dto = await _svc.PointerEntreeAsync(Matricule);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST /api/pointage/sortie
    [HttpPost("sortie")]
    public async Task<IActionResult> PointerSortie()
    {
        try
        {
            var dto = await _svc.PointerSortieAsync(Matricule);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST /api/pointage/heartbeat
    [HttpPost("heartbeat")]
    public async Task<IActionResult> Heartbeat()
    {
        await _svc.HeartbeatAsync(Matricule);
        return NoContent();
    }
}
