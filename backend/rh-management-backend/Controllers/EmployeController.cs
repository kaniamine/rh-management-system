using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/employes")]
[Authorize]   // JWT obligatoire
public class EmployeController : ControllerBase
{
    private readonly RhDbContext _db;
    public EmployeController(RhDbContext db) => _db = db;

    // GET /api/employes — réservé RH/admin
    [HttpGet]
    [Authorize(Roles = "rh,admin")]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.Employes
            .Where(e => e.IsActive)
            .OrderBy(e => e.Nom)
            .Select(e => new {
                e.Id,
                e.Matricule,
                e.NomComplet,
                e.Direction,
                e.Service,
                e.Fonction,
                e.SuperieurHierarchiqueMatricule,
                e.SoldeConges
            })
            .ToListAsync();
        return Ok(list);
    }

    // GET /api/employes/{matricule} — auto-remplissage formulaire
    [HttpGet("{matricule}")]
    public async Task<IActionResult> GetByMatricule(string matricule)
    {
        var e = await _db.Employes
            .FirstOrDefaultAsync(x => x.Matricule == matricule && x.IsActive);
        if (e == null)
            return NotFound(new { message = "Employé introuvable." });

        string supNom = string.Empty;
        if (!string.IsNullOrEmpty(e.SuperieurHierarchiqueMatricule))
        {
            var sup = await _db.Employes
                .FirstOrDefaultAsync(x => x.Matricule == e.SuperieurHierarchiqueMatricule);
            supNom = sup?.NomComplet ?? string.Empty;
        }

        return Ok(new
        {
            e.Matricule,
            e.NomComplet,
            e.Direction,
            e.Service,
            e.Fonction,
            e.SoldeConges,
            SuperieurHierarchique = supNom,
            e.SuperieurHierarchiqueMatricule
        });
    }

    // PATCH /api/employes/{matricule}/solde — mise à jour solde (RH seulement)
    [HttpPatch("{matricule}/solde")]
    [Authorize(Roles = "rh,admin")]
    public async Task<IActionResult> UpdateSolde(string matricule, [FromBody] int nouveauSolde)
    {
        var e = await _db.Employes.FirstOrDefaultAsync(x => x.Matricule == matricule);
        if (e == null) return NotFound();
        e.SoldeConges = nouveauSolde;
        await _db.SaveChangesAsync();
        return Ok(new { soldeConges = e.SoldeConges });
    }
}