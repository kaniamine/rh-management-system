using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/demandes-conge")]
public class DemandeCongeController : ControllerBase
{
    private readonly RhDbContext _db;

    public DemandeCongeController(RhDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<ActionResult<DemandeCongeResponse>> Create([FromBody] CreateDemandeCongeDto? dto)
    {
        if (dto == null)
        {
            return BadRequest(new { message = "Requête invalide." });
        }

        if (string.IsNullOrWhiteSpace(dto.TypeConge))
        {
            return BadRequest(new { message = "Le type de congé est obligatoire." });
        }

        if (dto.DateDebut == default || dto.DateFin == default)
        {
            return BadRequest(new { message = "Les dates de début et de fin sont obligatoires." });
        }

        if (dto.DateFin < dto.DateDebut)
        {
            return BadRequest(new { message = "La date de fin doit être postérieure ou égale à la date de début." });
        }

        var typeDuree = string.IsNullOrWhiteSpace(dto.TypeDuree) ? "Journée entière" : dto.TypeDuree.Trim();
        var demiJournee = typeDuree.Contains("Demi", StringComparison.OrdinalIgnoreCase);

        if (demiJournee && dto.DateDebut != dto.DateFin)
        {
            return BadRequest(new { message = "Pour une demi-journée, la date de début et de fin doivent être le même jour." });
        }

        if (!dto.EstBrouillon)
        {
            if (string.IsNullOrWhiteSpace(dto.NomComplet) || string.IsNullOrWhiteSpace(dto.Matricule))
            {
                return BadRequest(new { message = "Le nom complet et le matricule sont obligatoires pour une soumission." });
            }

            if (string.IsNullOrWhiteSpace(dto.Motif))
            {
                return BadRequest(new { message = "Le motif est obligatoire pour soumettre la demande." });
            }

            if (IsCongeMaladie(dto.TypeConge) && string.IsNullOrWhiteSpace(dto.PieceJustificativeFichierNom))
            {
                return BadRequest(new { message = "Une pièce justificative est obligatoire pour un congé maladie." });
            }
        }

        var dureeJours = ComputeDureeJours(dto.DateDebut, dto.DateFin, demiJournee);
        if (dureeJours < 1)
        {
            return BadRequest(new { message = "Durée invalide." });
        }

        var statut = dto.EstBrouillon ? "Brouillon" : "En attente";

        var entity = new DemandeConge
        {
            NomComplet = (dto.NomComplet ?? string.Empty).Trim(),
            Matricule = (dto.Matricule ?? string.Empty).Trim(),
            Service = NullIfWhiteSpace(dto.Service),
            SuperieurHierarchique = NullIfWhiteSpace(dto.SuperieurHierarchique),
            GradeFonction = NullIfWhiteSpace(dto.GradeFonction),
            TypeConge = dto.TypeConge.Trim(),
            TypeDuree = typeDuree,
            DateDebut = dto.DateDebut,
            DateFin = dto.DateFin,
            DureeJours = dureeJours,
            Motif = NullIfWhiteSpace(dto.Motif),
            AdressePendantConge = NullIfWhiteSpace(dto.AdressePendantConge),
            Telephone = NullIfWhiteSpace(dto.Telephone),
            PieceJustificativeFichierNom = NullIfWhiteSpace(dto.PieceJustificativeFichierNom),
            EstBrouillon = dto.EstBrouillon,
            Statut = statut,
            CreatedAt = DateTime.UtcNow
        };

        _db.DemandesConges.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new DemandeCongeResponse(entity.Id, entity.Statut));
    }

    [HttpGet]
    public async Task<ActionResult<List<DemandeConge>>> GetAll()
    {
        return await _db.DemandesConges.AsNoTracking().ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DemandeConge>> GetById(int id)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        return d == null ? NotFound() : Ok(d);
    }

    private static bool IsCongeMaladie(string typeConge) =>
        typeConge.Contains("maladie", StringComparison.OrdinalIgnoreCase);

    private static int ComputeDureeJours(DateOnly debut, DateOnly fin, bool demiJournee)
    {
        var joursCalendaires = fin.DayNumber - debut.DayNumber + 1;
        if (joursCalendaires < 1)
        {
            return 0;
        }

        return demiJournee ? 1 : joursCalendaires;
    }

    private static string? NullIfWhiteSpace(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s.Trim();
}

public sealed class CreateDemandeCongeDto
{
    public string TypeConge { get; set; } = string.Empty;
    public DateOnly DateDebut { get; set; }
    public DateOnly DateFin { get; set; }
    public bool EstBrouillon { get; set; }
    public string? NomComplet { get; set; }
    public string? Matricule { get; set; }
    public string? Service { get; set; }
    public string? SuperieurHierarchique { get; set; }
    public string? GradeFonction { get; set; }
    public string? TypeDuree { get; set; }
    public string? Motif { get; set; }
    public string? AdressePendantConge { get; set; }
    public string? Telephone { get; set; }
    public string? PieceJustificativeFichierNom { get; set; }
}

public sealed class DemandeCongeResponse
{
    public int Id { get; init; }
    public string Statut { get; init; } = string.Empty;

    public DemandeCongeResponse(int id, string statut)
    {
        Id = id;
        Statut = statut;
    }
}
