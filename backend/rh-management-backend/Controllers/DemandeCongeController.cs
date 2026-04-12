using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;
using System.Text.RegularExpressions;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/conge")]
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
            return BadRequest(new { message = "Requête invalide." });

        // --- Champs obligatoires ---
        if (string.IsNullOrWhiteSpace(dto.TypeConge))
            return BadRequest(new { message = "Le type de congé est obligatoire." });

        if (string.IsNullOrWhiteSpace(dto.NomComplet))
            return BadRequest(new { message = "Le nom complet est obligatoire." });

        if (string.IsNullOrWhiteSpace(dto.Matricule))
            return BadRequest(new { message = "Le matricule est obligatoire." });

        if (dto.DateDebut == default || dto.DateFin == default)
            return BadRequest(new { message = "Les dates de début et de fin sont obligatoires." });

        // --- RÈGLE 1 : date début >= aujourd'hui + 3 jours ouvrés ---
        if (!dto.EstBrouillon)
        {
            var minDateDebut = AjouterJoursOuvres(DateOnly.FromDateTime(DateTime.Today), 3);
            if (dto.DateDebut < minDateDebut)
                return BadRequest(new
                {
                    message = $"La date de début doit être au minimum le {minDateDebut:dd/MM/yyyy} (3 jours ouvrés à partir d'aujourd'hui)."
                });
        }

        // --- RÈGLE 2 : cohérence dates ---
        if (dto.DateFin < dto.DateDebut)
            return BadRequest(new { message = "La date de fin doit être postérieure ou égale à la date de début." });

        // --- RÈGLE 3 : validation téléphone (si renseigné) ---
        if (!string.IsNullOrWhiteSpace(dto.Telephone))
        {
            var telNormalise = Regex.Replace(dto.Telephone.Trim(), @"[\s\-\.]", "");
            if (!Regex.IsMatch(telNormalise, @"^\+?[0-9]{8,15}$"))
                return BadRequest(new { message = "Le numéro de téléphone est invalide. Saisissez uniquement des chiffres (8 à 15 chiffres, le + international est accepté)." });
        }

        // --- RÈGLE 4 : validation email (si renseigné) ---
        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            if (!Regex.IsMatch(dto.Email.Trim(), @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                return BadRequest(new { message = "L'adresse email est invalide. Elle doit contenir un @." });
        }

        var typeDuree = string.IsNullOrWhiteSpace(dto.TypeDuree) ? "Journée entière" : dto.TypeDuree.Trim();
        var demiJournee = typeDuree.Contains("Demi", StringComparison.OrdinalIgnoreCase);

        if (demiJournee && dto.DateDebut != dto.DateFin)
            return BadRequest(new { message = "Pour une demi-journée, la date de début et de fin doivent être le même jour." });

        // --- RÈGLE 5 : motif obligatoire si congé exceptionnel ---
        if (!dto.EstBrouillon)
        {
            bool estExceptionnel = dto.TypeConge.Contains("exceptionnel", StringComparison.OrdinalIgnoreCase)
                                || dto.TypeConge.Contains("courte durée", StringComparison.OrdinalIgnoreCase);
            if (estExceptionnel && string.IsNullOrWhiteSpace(dto.Motif))
                return BadRequest(new { message = "Le motif est obligatoire pour un congé exceptionnel de courte durée." });

            if (IsCongeMaladie(dto.TypeConge) && string.IsNullOrWhiteSpace(dto.PieceJustificativeFichierNom))
                return BadRequest(new { message = "Une pièce justificative est obligatoire pour un congé maladie." });
        }

        var dureeJours = ComputeDureeJours(dto.DateDebut, dto.DateFin, demiJournee);
        if (dureeJours < 1)
            return BadRequest(new { message = "Durée invalide : la durée calculée est inférieure à 1 jour." });

        var statut = dto.EstBrouillon ? "Brouillon" : "En attente de validation N+1";

        var entity = new DemandeConge
        {
            NomComplet = dto.NomComplet.Trim(),
            Matricule = dto.Matricule.Trim(),
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

        return CreatedAtAction(nameof(GetById), new { id = entity.Id },
            new DemandeCongeResponse(entity.Id, entity.Statut));
    }

    [HttpGet]
    public async Task<ActionResult<List<DemandeConge>>> GetAll()
        => await _db.DemandesConges.AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DemandeConge>> GetById(int id)
    {
        var d = await _db.DemandesConges.FindAsync(id);
        return d == null ? NotFound() : Ok(d);
    }

    // ── Helpers ───────────────────────────────────────────────

    private static DateOnly AjouterJoursOuvres(DateOnly date, int jours)
    {
        int ajoutes = 0;
        while (ajoutes < jours)
        {
            date = date.AddDays(1);
            if (date.DayOfWeek != DayOfWeek.Saturday && date.DayOfWeek != DayOfWeek.Sunday)
                ajoutes++;
        }
        return date;
    }

    private static bool IsCongeMaladie(string typeConge)
        => typeConge.Contains("maladie", StringComparison.OrdinalIgnoreCase);

    private static int ComputeDureeJours(DateOnly debut, DateOnly fin, bool demiJournee)
    {
        var jours = fin.DayNumber - debut.DayNumber + 1;
        if (jours < 1) return 0;
        return demiJournee ? 1 : jours;
    }

    private static string? NullIfWhiteSpace(string? s)
        => string.IsNullOrWhiteSpace(s) ? null : s.Trim();
}

// ── DTOs ──────────────────────────────────────────────────────

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
    public string? Email { get; set; }   // ← NOUVEAU
    public string? PieceJustificativeFichierNom { get; set; }
}

public sealed class DemandeCongeResponse
{
    public int Id { get; init; }
    public string Statut { get; init; } = string.Empty;

    public DemandeCongeResponse(int id, string statut) { Id = id; Statut = statut; }
}