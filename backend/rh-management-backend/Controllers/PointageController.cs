using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using rh_management_backend.Data;
using rh_management_backend.Services;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/pointage")]
[Authorize]
public class PointageController : ControllerBase
{
    private readonly IPointageService _svc;
    private readonly RhDbContext _db;
    private readonly IConfiguration _config;

    public PointageController(IPointageService svc, RhDbContext db, IConfiguration config)
    {
        _svc    = svc;
        _db     = db;
        _config = config;
    }

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

    // GET /api/pointage/aujourd-hui  (alias: aujourdhui)
    [HttpGet("aujourd-hui")]
    [HttpGet("aujourdhui")]
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

    // POST /api/pointage/entree-avec-localisation  (alias: entree-localisee)
    [HttpPost("entree-avec-localisation")]
    [HttpPost("entree-localisee")]
    public async Task<IActionResult> EntreeLocalisee([FromBody] EntreeAvecLocalisationDto dto)
    {
        try
        {
            if (dto.Latitude.HasValue && dto.Longitude.HasValue)
            {
                var latSociete = _config.GetValue<double>("Localisation:LatitudeSociete");
                var lonSociete = _config.GetValue<double>("Localisation:LongitudeSociete");
                var rayon      = _config.GetValue<double>("Localisation:RayonAutoriseMetre", 500);

                var distance = CalculerDistanceMetres(
                    dto.Latitude.Value, dto.Longitude.Value,
                    latSociete, lonSociete);

                if (distance > rayon)
                    return BadRequest(new {
                        message       = $"Pointage refusé : vous êtes à {(int)distance} m du bureau (rayon autorisé : {(int)rayon} m).",
                        distance      = (int)distance,
                        rayonAutorise = (int)rayon
                    });
            }

            var result = await _svc.PointerEntreeAsync(Matricule);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // Tunis = UTC+1 (Africa/Tunis, sans changement d'heure)
    private static DateTime HeureLocale()
    {
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("Africa/Tunis");
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        }
        catch
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("W. Central Africa Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        }
    }

    private static double CalculerDistanceMetres(
        double lat1, double lon1,
        double lat2, double lon2)
    {
        const double R = 6371000;
        var phi1 = lat1 * Math.PI / 180;
        var phi2 = lat2 * Math.PI / 180;
        var dphi = (lat2 - lat1) * Math.PI / 180;
        var dlam = (lon2 - lon1) * Math.PI / 180;
        var a = Math.Sin(dphi / 2) * Math.Sin(dphi / 2)
              + Math.Cos(phi1) * Math.Cos(phi2)
              * Math.Sin(dlam / 2) * Math.Sin(dlam / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    [HttpGet("historique-rh")]
    [Authorize(Roles = "rh,admin")]
    public async Task<IActionResult> GetHistoriqueRH(
        [FromQuery] string? date = null,
        [FromQuery] string? matricule = null,
        [FromQuery] string? statut = null)
    {
        try
        {
            var query = _db.Pointages
                .Include(p => p.User)
                .ThenInclude(u => u.Employe)
                .AsQueryable();

            if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var dateFiltre))
            {
                var dateVal = dateFiltre.Date;
                query = query.Where(p => p.Date == dateVal);
            }

            if (!string.IsNullOrEmpty(matricule))
                query = query.Where(p => p.User.Matricule == matricule);

            if (!string.IsNullOrEmpty(statut))
                query = query.Where(p => p.Statut == statut);

            var raw = await query
                .OrderByDescending(p => p.Date)
                .Take(500)
                .Select(p => new {
                    p.Id,
                    UserMatricule    = p.User.Matricule,
                    EmployeNom       = p.User.Employe != null ? p.User.Employe.Nom       : "",
                    EmployePrenom    = p.User.Employe != null ? p.User.Employe.Prenom    : "",
                    EmployeDirection = p.User.Employe != null ? p.User.Employe.Direction : "",
                    p.Date,
                    p.HeureEntree,
                    p.HeureSortie,
                    p.DureeMinutes,
                    p.RetardMinutes,
                    p.Statut
                })
                .ToListAsync();

            var data = raw.Select(p => new {
                id            = p.Id,
                matricule     = p.UserMatricule,
                nom           = p.EmployeNom,
                prenom        = p.EmployePrenom,
                direction     = p.EmployeDirection,
                date          = p.Date.ToString("yyyy-MM-dd"),
                heureEntree   = p.HeureEntree.HasValue ? p.HeureEntree.Value.ToString("HH:mm") : null,
                heureSortie   = p.HeureSortie.HasValue ? p.HeureSortie.Value.ToString("HH:mm") : null,
                duree         = p.DureeMinutes,
                retardMinutes = p.RetardMinutes,
                statut        = p.Statut
            }).ToList();

            return Ok(data);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[POINTAGE-RH] Error: {ex.Message}");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("stats-jour")]
    [Authorize(Roles = "rh,admin")]
    public async Task<IActionResult> GetStatsJour()
    {
        try
        {
            var aujourdhui    = HeureLocale().Date;
            var totalEmployes = await _db.Users.CountAsync(u => u.IsActive);

            var presents = await _db.Pointages
                .CountAsync(p => p.Date == aujourdhui && p.Statut == "Présent");
            var retards  = await _db.Pointages
                .CountAsync(p => p.Date == aujourdhui && p.Statut == "En retard");

            var pointagesAujourdhui = await _db.Pointages
                .CountAsync(p => p.Date == aujourdhui);
            var absents = Math.Max(0, totalEmployes - pointagesAujourdhui);

            double dureeMoyenneMinutes = await _db.Pointages
                .Where(p => p.Date == aujourdhui && p.DureeMinutes.HasValue)
                .AverageAsync(p => (double?)p.DureeMinutes) ?? 0.0;

            var dureeMoyenne = dureeMoyenneMinutes > 0
                ? $"{(int)dureeMoyenneMinutes / 60}h{(int)dureeMoyenneMinutes % 60:D2}"
                : "—";

            return Ok(new {
                presents,
                absents,
                retards,
                dureeMoyenne,
                totalEmployes,
                date = aujourdhui.ToString("dd/MM/yyyy")
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[STATS-JOUR] Error: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

public class EntreeAvecLocalisationDto
{
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? HeureLocale { get; set; }
}
