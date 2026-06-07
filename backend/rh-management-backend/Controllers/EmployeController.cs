using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/employes")]
[Authorize]
public class EmployeController : ControllerBase
{
    private readonly RhDbContext _db;
    public EmployeController(RhDbContext db) => _db = db;

    // POST /api/employes — création employé + compte utilisateur (RH)
    [HttpPost]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> Create([FromBody] CreateEmployeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Matricule) || string.IsNullOrWhiteSpace(dto.Nom) || string.IsNullOrWhiteSpace(dto.Prenom))
            return BadRequest(new { message = "Matricule, nom et prénom sont obligatoires." });

        var matricule = dto.Matricule.Trim().ToUpper();

        if (await _db.Employes.AnyAsync(e => e.Matricule == matricule))
            return Conflict(new { message = "Ce matricule est déjà utilisé." });

        var employe = new Employe
        {
            Matricule                      = matricule,
            Nom                            = dto.Nom.Trim(),
            Prenom                         = dto.Prenom.Trim(),
            NomComplet                     = $"{dto.Prenom.Trim()} {dto.Nom.Trim()}",
            Direction                      = dto.Direction,
            Service                        = dto.Service,
            Fonction                       = dto.Fonction,
            SuperieurHierarchiqueMatricule = dto.SuperieurHierarchiqueMatricule?.Trim().ToUpper(),
            SoldeConges                    = dto.SoldeConges,
            SoldeCongesJours               = dto.SoldeConges,
            IsActive                       = true,
            CreatedAt                      = DateTime.UtcNow
        };

        _db.Employes.Add(employe);
        await _db.SaveChangesAsync();
        Console.WriteLine($"[EMPLOYE CREATE] ✅ Saved to DB with Id={employe.Id}");

        var rolesValides = new[] { "employe", "n1", "dg", "rh" };
        var roleChoisi = string.IsNullOrWhiteSpace(dto.Role) ? "employe" : dto.Role;
        if (!rolesValides.Contains(roleChoisi))
            return BadRequest(new { message = $"Rôle invalide : {roleChoisi}. Valeurs acceptées : employe, n1, dg, rh." });

        var user = new User
        {
            Matricule          = matricule,
            PasswordHash       = BCrypt.Net.BCrypt.HashPassword("0000"),
            Role               = roleChoisi,
            IsActive           = true,
            MustChangePassword = true,
            NombreConnexions   = 0,
            EmployeId          = employe.Id,
            CreatedAt          = DateTime.UtcNow
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
            employe.SoldeConges,
            employe.IsActive
        });
    }

    // GET /api/employes — réservé RH
    [HttpGet]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.Employes
            .Where(e => e.IsActive)
            .OrderBy(e => e.Nom)
            .Select(e => new {
                e.Id,
                e.Matricule,
                e.Nom,
                e.Prenom,
                e.NomComplet,
                e.Direction,
                e.Service,
                e.Fonction,
                e.SuperieurHierarchiqueMatricule,
                e.SoldeConges,
                e.Telephone,
                e.IsActive,
                Role = _db.Users.Where(u => u.Matricule == e.Matricule).Select(u => u.Role).FirstOrDefault()
            })
            .ToListAsync();
        return Ok(list);
    }

    // GET /api/employes/{matricule}
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
            e.Telephone,
            SuperieurHierarchique          = supNom,
            e.SuperieurHierarchiqueMatricule
        });
    }

    // PATCH /api/employes/{matricule} — mise à jour partielle (RH)
    [HttpPatch("{matricule}")]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> Update(string matricule, [FromBody] UpdateEmployeDto dto)
    {
        var emp = await _db.Employes.FirstOrDefaultAsync(e => e.Matricule == matricule.ToUpper() && e.IsActive);
        if (emp == null)
            return NotFound(new { message = "Employé introuvable." });

        if (!string.IsNullOrWhiteSpace(dto.Nom))    emp.Nom    = dto.Nom.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Prenom)) emp.Prenom = dto.Prenom.Trim();
        if (dto.Direction  != null) emp.Direction  = dto.Direction;
        if (dto.Service    != null) emp.Service    = dto.Service;
        if (dto.Fonction   != null) emp.Fonction   = dto.Fonction;
        if (dto.SuperieurHierarchiqueMatricule != null)
            emp.SuperieurHierarchiqueMatricule = dto.SuperieurHierarchiqueMatricule;
        if (dto.SoldeConges.HasValue) emp.SoldeConges = dto.SoldeConges.Value;

        if (!string.IsNullOrWhiteSpace(dto.Nom) || !string.IsNullOrWhiteSpace(dto.Prenom))
            emp.NomComplet = $"{emp.Prenom} {emp.Nom}";

        if (!string.IsNullOrWhiteSpace(dto.Role))
        {
            var rolesValides = new[] { "employe", "n1", "dg", "rh" };
            if (!rolesValides.Contains(dto.Role))
                return BadRequest(new { message = $"Rôle invalide : {dto.Role}. Valeurs acceptées : employe, n1, dg, rh." });

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Matricule == emp.Matricule);
            if (user != null) user.Role = dto.Role;
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Employé mis à jour avec succès." });
    }

    // PATCH /api/employes/{matricule}/desactiver
    [HttpPatch("{matricule}/desactiver")]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> Desactiver(string matricule)
    {
        var employe = await _db.Employes.FirstOrDefaultAsync(e => e.Matricule == matricule);
        if (employe == null)
            return NotFound();

        employe.IsActive = false;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Matricule == matricule);
        if (user != null) user.IsActive = false;

        await _db.SaveChangesAsync();
        Console.WriteLine($"[EMPLOYE DEACTIVATE] ✅ {matricule} deactivated");
        return Ok(new { message = "Employé désactivé." });
    }

    // PATCH /api/employes/{matricule}/solde
    [HttpPatch("{matricule}/solde")]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> UpdateSolde(string matricule, [FromBody] int nouveauSolde)
    {
        var e = await _db.Employes.FirstOrDefaultAsync(x => x.Matricule == matricule);
        if (e == null) return NotFound();
        e.SoldeConges = nouveauSolde;
        await _db.SaveChangesAsync();
        return Ok(new { soldeConges = e.SoldeConges });
    }

    // PATCH /api/employes/{matricule}/telephone
    [HttpPatch("{matricule}/telephone")]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> UpdateTelephone(string matricule, [FromBody] string? telephone)
    {
        Console.WriteLine($"[TELEPHONE] PATCH {matricule} → '{telephone}'");

        var employe = await _db.Employes
            .FirstOrDefaultAsync(e => e.Matricule == matricule);

        if (employe == null)
            return NotFound(new { message = "Employé introuvable." });

        employe.Telephone = telephone ?? string.Empty;
        await _db.SaveChangesAsync();

        Console.WriteLine($"[TELEPHONE] ✅ Updated for {matricule}");
        return Ok(new {
            message   = "Numéro de téléphone mis à jour.",
            telephone = employe.Telephone
        });
    }

    // PATCH /api/employes/{id:int}/desactiver — désactiver par id
    [HttpPatch("{id:int}/desactiver")]
    [Authorize(Roles = "rh")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var emp = await _db.Employes.FindAsync(id);
        if (emp == null)
            return NotFound(new { message = "Employé introuvable." });

        emp.IsActive = false;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Matricule == emp.Matricule);
        if (user != null) user.IsActive = false;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Employé désactivé avec succès." });
    }

    // PUT /api/employes/mon-telephone
    [HttpPut("mon-telephone")]
    public async Task<IActionResult> ChangerMonTelephone([FromBody] TelephoneDto dto)
    {
        if (string.IsNullOrEmpty(dto.Telephone))
            return BadRequest(new { error = "Le numéro de téléphone est obligatoire." });

        var telNettoye = NettoyerTel(dto.Telephone);

        if (!System.Text.RegularExpressions.Regex.IsMatch(telNettoye, @"^\d{8}$"))
            return BadRequest(new { error = "Format invalide. Entrez un numéro tunisien à 8 chiffres." });

        var matricule = User.FindFirstValue("matricule");
        if (string.IsNullOrEmpty(matricule))
            return Unauthorized();

        var employe = await _db.Employes
            .FirstOrDefaultAsync(e => e.Matricule == matricule && e.IsActive);

        if (employe == null)
            return NotFound(new { error = "Employé introuvable." });

        employe.Telephone = telNettoye;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Numéro de téléphone mis à jour avec succès." });
    }

    private static string NettoyerTel(string t)
    {
        t = t.Replace(" ", "").Replace("-", "").Replace(".", "");
        if (t.StartsWith("+216"))      t = t.Substring(4);
        else if (t.StartsWith("00216")) t = t.Substring(5);
        else if (t.StartsWith("216"))   t = t.Substring(3);
        return t.Trim();
    }
}

public class CreateEmployeDto
{
    public string Matricule  { get; set; } = string.Empty;
    public string Nom        { get; set; } = string.Empty;
    public string Prenom     { get; set; } = string.Empty;
    public string? Direction { get; set; }
    public string? Service   { get; set; }
    public string? Fonction  { get; set; }
    public string? SuperieurHierarchiqueMatricule { get; set; }
    public string Role       { get; set; } = "employe";
    public int SoldeConges   { get; set; } = 30;
    public string? Telephone { get; set; }
}

public class UpdateEmployeDto
{
    public string? Nom       { get; set; }
    public string? Prenom    { get; set; }
    public string? Direction { get; set; }
    public string? Service   { get; set; }
    public string? Fonction  { get; set; }
    public string? SuperieurHierarchiqueMatricule { get; set; }
    public int?    SoldeConges { get; set; }
    public string? Role      { get; set; }
    public string? Telephone { get; set; }
}

public class TelephoneDto
{
    public string Telephone { get; set; } = "";
}
