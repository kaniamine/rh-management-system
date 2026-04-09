using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DemandeAutorisationController : ControllerBase
{
    private readonly RhDbContext _context;

    public DemandeAutorisationController(RhDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DemandeAutorisation>>> GetAll()
    {
        var demandes = await _context.DemandesAutorisations.ToListAsync();
        return Ok(demandes);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DemandeAutorisation>> GetById(int id)
    {
        var demande = await _context.DemandesAutorisations.FindAsync(id);
        if (demande == null)
        {
            return NotFound(new { message = "Demande d'autorisation introuvable." });
        }

        return Ok(demande);
    }

    [HttpPost]
    public async Task<ActionResult<DemandeAutorisationResponse>> Create([FromBody] CreateDemandeAutorisationDto? dto)
    {
        if (dto == null)
        {
            return BadRequest(new { message = "Requête invalide." });
        }

        if (string.IsNullOrWhiteSpace(dto.TypeAutorisation))
        {
            return BadRequest(new { message = "Le type d'autorisation est obligatoire." });
        }

        if (dto.DateDemande == default)
        {
            return BadRequest(new { message = "La date de la demande est obligatoire." });
        }

        if (string.IsNullOrWhiteSpace(dto.NomComplet) || string.IsNullOrWhiteSpace(dto.Matricule))
        {
            return BadRequest(new { message = "Le nom complet et le matricule sont obligatoires." });
        }

        TimeOnly? heureSortie = null;
        TimeOnly? heureRetour = null;

        if (!string.IsNullOrWhiteSpace(dto.HeureSortie))
        {
            if (!TimeOnly.TryParse(dto.HeureSortie.Trim(), out var hs))
            {
                return BadRequest(new { message = "Heure de début invalide (format HH:mm)." });
            }

            heureSortie = hs;
        }

        if (!string.IsNullOrWhiteSpace(dto.HeureRetour))
        {
            if (!TimeOnly.TryParse(dto.HeureRetour.Trim(), out var hr))
            {
                return BadRequest(new { message = "Heure de fin invalide (format HH:mm)." });
            }

            heureRetour = hr;
        }

        if (!dto.EstBrouillon)
        {
            if (string.IsNullOrWhiteSpace(dto.Motif))
            {
                return BadRequest(new { message = "Le motif est obligatoire pour soumettre la demande." });
            }

            if (!heureSortie.HasValue || !heureRetour.HasValue)
            {
                return BadRequest(new { message = "L'heure de début et l'heure de fin sont obligatoires pour une soumission." });
            }

            if (heureRetour.Value <= heureSortie.Value)
            {
                return BadRequest(new { message = "L'heure de fin doit être après l'heure de début." });
            }
        }

        var statut = dto.EstBrouillon ? "Brouillon" : "En attente";

        var entity = new DemandeAutorisation
        {
            NomComplet = dto.NomComplet.Trim(),
            Matricule = dto.Matricule.Trim(),
            GradeFonction = string.IsNullOrWhiteSpace(dto.GradeFonction) ? null : dto.GradeFonction.Trim(),
            TypeAutorisation = dto.TypeAutorisation.Trim(),
            DateDemande = dto.DateDemande,
            HeureSortie = heureSortie,
            HeureRetour = heureRetour,
            Motif = string.IsNullOrWhiteSpace(dto.Motif) ? null : dto.Motif.Trim(),
            Destination = string.IsNullOrWhiteSpace(dto.Destination) ? null : dto.Destination.Trim(),
            Telephone = string.IsNullOrWhiteSpace(dto.Telephone) ? null : dto.Telephone.Trim(),
            Statut = statut,
            CreatedAt = DateTime.UtcNow
        };

        _context.DemandesAutorisations.Add(entity);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id },
            new DemandeAutorisationResponse(entity.Id, entity.Statut));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDemandeAutorisationDto? dto)
    {
        if (dto is null)
        {
            return BadRequest(new { message = "Requête invalide." });
        }

        if (string.IsNullOrWhiteSpace(dto.Statut))
        {
            return BadRequest(new { message = "Le statut est obligatoire." });
        }

        var demande = await _context.DemandesAutorisations.FindAsync(id);
        if (demande == null)
        {
            return NotFound(new { message = "Demande d'autorisation introuvable." });
        }

        demande.Statut = dto.Statut.Trim();
        await _context.SaveChangesAsync();

        return Ok(demande);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var demande = await _context.DemandesAutorisations.FindAsync(id);
        if (demande == null)
        {
            return NotFound(new { message = "Demande d'autorisation introuvable." });
        }

        _context.DemandesAutorisations.Remove(demande);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public sealed class CreateDemandeAutorisationDto
{
    public string NomComplet { get; set; } = string.Empty;
    public string Matricule { get; set; } = string.Empty;
    public string? GradeFonction { get; set; }
    public string TypeAutorisation { get; set; } = string.Empty;
    public DateOnly DateDemande { get; set; }
    public string? HeureSortie { get; set; }
    public string? HeureRetour { get; set; }
    public string? Motif { get; set; }
    public string? Destination { get; set; }
    public string? Telephone { get; set; }
    public bool EstBrouillon { get; set; }
}

public sealed class UpdateDemandeAutorisationDto
{
    public string Statut { get; set; } = string.Empty;
}

public sealed class DemandeAutorisationResponse
{
    public int Id { get; init; }
    public string Statut { get; init; } = string.Empty;

    public DemandeAutorisationResponse(int id, string statut)
    {
        Id = id;
        Statut = statut;
    }
}
