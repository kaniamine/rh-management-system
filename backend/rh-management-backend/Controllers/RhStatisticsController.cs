using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using rh_management_backend.Services;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/rh-statistics")]
[Authorize(Roles = "rh,admin")]
public class RhStatisticsController : ControllerBase
{
    private readonly IRhStatisticsService _svc;
    public RhStatisticsController(IRhStatisticsService svc) => _svc = svc;

    // GET /api/rh-statistics/overview?annee=2026&mois=5
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview([FromQuery] int? annee, [FromQuery] int? mois)
    {
        if (mois.HasValue && (mois < 1 || mois > 12))
            return BadRequest(new { message = "Le mois doit être compris entre 1 et 12." });

        return Ok(await _svc.GetOverviewAsync(annee, mois));
    }

    // GET /api/rh-statistics/conges?annee=2026&mois=5
    [HttpGet("conges")]
    public async Task<IActionResult> GetCongeStats([FromQuery] int? annee, [FromQuery] int? mois)
    {
        if (mois.HasValue && (mois < 1 || mois > 12))
            return BadRequest(new { message = "Le mois doit être compris entre 1 et 12." });

        return Ok(await _svc.GetCongeStatsAsync(annee, mois));
    }

    // GET /api/rh-statistics/maladies?annee=2026&mois=5
    [HttpGet("maladies")]
    public async Task<IActionResult> GetMaladieStats([FromQuery] int? annee, [FromQuery] int? mois)
    {
        if (mois.HasValue && (mois < 1 || mois > 12))
            return BadRequest(new { message = "Le mois doit être compris entre 1 et 12." });

        return Ok(await _svc.GetMaladieStatsAsync(annee, mois));
    }

    // GET /api/rh-statistics/autorisations?annee=2026&mois=5
    [HttpGet("autorisations")]
    public async Task<IActionResult> GetAutorisationStats([FromQuery] int? annee, [FromQuery] int? mois)
    {
        if (mois.HasValue && (mois < 1 || mois > 12))
            return BadRequest(new { message = "Le mois doit être compris entre 1 et 12." });

        return Ok(await _svc.GetAutorisationStatsAsync(annee, mois));
    }
}
