using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "rh,admin")]
public class AdminController : ControllerBase
{
    private readonly RhDbContext _db;

    public AdminController(RhDbContext db) => _db = db;

    // POST /api/admin/trigger-accrual — déclenche un accrual mensuel immédiat
    [HttpPost("trigger-accrual")]
    public async Task<IActionResult> TriggerAccrual()
    {
        var employes = await _db.Employes
            .Where(e => e.IsActive)
            .ToListAsync();

        foreach (var e in employes)
        {
            e.SoldeConges      += 2;
            e.SoldeCongesJours += 2;
        }

        await _db.SaveChangesAsync();
        return Ok(new
        {
            message = $"Accrual appliqué à {employes.Count} employés.",
            count   = employes.Count
        });
    }
}
