using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/employes")]
[Authorize]   // JWT obligatoire
public class EmployeController : ControllerBase
{
    private readonly RhDbContext _db;
    public EmployeController(RhDbContext db) => _db = db;

    public record CreateEmployeDto(
        string Matricule,
        string Nom,
        string Prenom,
        string? Direction,
        string? Service,
        string? Fonction,
        string? SuperieurHierarchiqueMatricule,
        int SoldeConges = 30
    );

    // POST /api/employes — création employé + compte utilisateur (RH/admin)
    [HttpPost]
    [Authorize(Roles = "rh,admin")]
    public async Task<IActionResult> Create([FromBody] CreateEmployeDto dto)
    {
        Console.WriteLine($"[EMPLOYE CREATE] Received: {dto.Matricule} {dto.Nom} {dto.Prenom}");

        var matricule = dto.Matricule.Trim().ToUpper();

        if (await _db.Employes.AnyAsync(e => e.Matricule == matricule))
            return Conflict(new { message = "Ce matricule est déjà utilisé." });

        var employe = new Employe
        {
            Matricule = matricule,
            Nom = dto.Nom.Trim(),
            Prenom = dto.Prenom.Trim(),
            NomComplet = $"{dto.Nom.Trim()} {dto.Prenom.Trim()}",
            Direction = dto.Direction?.Trim(),
            Service = dto.Service?.Trim(),
            Fonction = dto.Fonction?.Trim(),
            SuperieurHierarchiqueMatricule = dto.SuperieurHierarchiqueMatricule?.Trim().ToUpper(),
            SoldeConges = dto.SoldeConges,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Employes.Add(employe);
        await _db.SaveChangesAsync();
        Console.WriteLine($"[EMPLOYE CREATE] ✅ Saved to DB with Id={employe.Id}");

        var user = new User
        {
            Matricule = matricule,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("0000"),
            Role = "employe",
            IsActive = true,
            MustChangePassword = true,
            NombreConnexions = 0,
            EmployeId = employe.Id,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        Console.WriteLine($"[EMPLOYE CREATE] ✅ User account created for {user.Matricule}");

        return CreatedAtAction(nameof(GetByMatricule), new { matricule = employe.Matricule }, new
        {
            employe.Id,
            employe.Matricule,
            employe.NomComplet,
            employe.Direction,
            employe.Service,
            employe.Fonction,
            employe.SoldeConges
        });
    }

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

    public record UpdateEmployeDto(
        string Nom,
        string Prenom,
        string? Direction,
        string? Service,
        string? Fonction,
        string? SuperieurHierarchiqueMatricule,
        int SoldeConges = 30
    );

    // PUT /api/employes/{matricule} — modifier un employé (RH/admin)
    [HttpPut("{matricule}")]
    [Authorize(Roles = "rh,admin")]
    public async Task<IActionResult> Update(string matricule, [FromBody] UpdateEmployeDto dto)
    {
        var employe = await _db.Employes
            .FirstOrDefaultAsync(e => e.Matricule == matricule && e.IsActive);
        if (employe == null)
            return NotFound(new { message = "Employé introuvable." });

        employe.Nom = dto.Nom.Trim();
        employe.Prenom = dto.Prenom.Trim();
        employe.NomComplet = $"{dto.Nom.Trim()} {dto.Prenom.Trim()}";
        employe.Direction = dto.Direction?.Trim();
        employe.Service = dto.Service?.Trim();
        employe.Fonction = dto.Fonction?.Trim();
        employe.SuperieurHierarchiqueMatricule = dto.SuperieurHierarchiqueMatricule?.Trim().ToUpper();
        employe.SoldeConges = dto.SoldeConges;

        await _db.SaveChangesAsync();
        Console.WriteLine($"[EMPLOYE UPDATE] ✅ {matricule} updated");

        return Ok(new
        {
            employe.Matricule,
            employe.NomComplet,
            employe.Direction,
            employe.Service,
            employe.Fonction,
            employe.SoldeConges,
            employe.SuperieurHierarchiqueMatricule
        });
    }

    // PATCH /api/employes/{matricule}/desactiver — désactiver un employé (RH/admin)
    [HttpPatch("{matricule}/desactiver")]
    [Authorize(Roles = "rh,admin")]
    public async Task<IActionResult> Desactiver(string matricule)
    {
        var employe = await _db.Employes
            .FirstOrDefaultAsync(e => e.Matricule == matricule);
        if (employe == null)
            return NotFound();

        employe.IsActive = false;

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Matricule == matricule);
        if (user != null) user.IsActive = false;

        await _db.SaveChangesAsync();
        Console.WriteLine($"[EMPLOYE DEACTIVATE] ✅ {matricule} deactivated");
        return Ok(new { message = "Employé désactivé." });
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