using Microsoft.AspNetCore.Mvc;
using rh_management_backend.Data;
using rh_management_backend.Models;
using Microsoft.EntityFrameworkCore;

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

    /// <summary>
    /// Get all authorization requests
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DemandeAutorisation>>> GetAll()
    {
        var demandes = await _context.DemandesAutorisations.ToListAsync();
        return Ok(demandes);
    }

    /// <summary>
    /// Get authorization request by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<DemandeAutorisation>> GetById(int id)
    {
        var demande = await _context.DemandesAutorisations.FindAsync(id);
        if (demande == null)
            return NotFound(new { message = "Demande d'autorisation introuvable." });

        return Ok(demande);
    }

    /// <summary>
    /// Create a new authorization request
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DemandeAutorisationResponse>> Create([FromBody] CreateDemandeAutorisationDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NomComplet)
            || string.IsNullOrWhiteSpace(dto.Matricule)
            || string.IsNullOrWhiteSpace(dto.TypeAutorisation))
        {
            return BadRequest(new { message = "Nom, matricule et type d'autorisation sont obligatoires." });
        }

        var entity = new DemandeAutorisation
        {
            NomComplet = dto.NomComplet.Trim(),
            Matricule = dto.Matricule.Trim(),
            GradeFonction = string.IsNullOrWhiteSpace(dto.GradeFonction) ? null : dto.GradeFonction.Trim(),
            TypeAutorisation = dto.TypeAutorisation.Trim(),
            DateDemande = dto.DateDemande,
            HeureSortie = dto.HeureSortie,
            HeureRetour = dto.HeureRetour,
            Motif = string.IsNullOrWhiteSpace(dto.Motif) ? null : dto.Motif.Trim(),
            Destination = string.IsNullOrWhiteSpace(dto.Destination) ? null : dto.Destination.Trim(),
            Telephone = string.IsNullOrWhiteSpace(dto.Telephone) ? null : dto.Telephone.Trim(),
            Statut = "En attente",
            CreatedAt = DateTime.UtcNow
        };

        _context.DemandesAutorisations.Add(entity);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id },
            new DemandeAutorisationResponse(entity.Id, entity.Statut));
    }

    /// <summary>
    /// Update authorization request status
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDemandeAutorisationDto dto)
    {
        var demande = await _context.DemandesAutorisations.FindAsync(id);
        if (demande == null)
            return NotFound(new { message = "Demande d'autorisation introuvable." });

        if (string.IsNullOrWhiteSpace(dto.Statut))
            return BadRequest(new { message = "Le statut est obligatoire." });

        demande.Statut = dto.Statut.Trim();
        _context.DemandesAutorisations.Update(demande);
        await _context.SaveChangesAsync();

        return Ok(demande);
    }

    /// <summary>
    /// Delete authorization request
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var demande = await _context.DemandesAutorisations.FindAsync(id);
        if (demande == null)
            return NotFound(new { message = "Demande d'autorisation introuvable." });

        _context.DemandesAutorisations.Remove(demande);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

internal record CreateDemandeAutorisationDto(
    string NomComplet,
    string Matricule,
    string? GradeFonction,
    string TypeAutorisation,
    DateOnly DateDemande,
    TimeOnly? HeureSortie,
    TimeOnly? HeureRetour,
    string? Motif,
    string? Destination,
    string? Telephone);

internal record UpdateDemandeAutorisationDto(string Statut);

internal record DemandeAutorisationResponse(int Id, string Statut);