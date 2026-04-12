using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using rh_management_backend.DTOs.Conge;
using rh_management_backend.Services;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/demandes-conge")]
[Authorize]
public class DemandeCongeController : ControllerBase
{
    private readonly IDemandeCongeService _svc;
    public DemandeCongeController(IDemandeCongeService svc) => _svc = svc;

    // GET /api/demandes-conge?matricule=EMP001&statut=En+attente+de+validation+N%2B1
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? matricule,
        [FromQuery] string? statut)
    {
        var list = await _svc.GetAllAsync(matricule, statut);
        return Ok(list);
    }

    // GET /api/demandes-conge/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _svc.GetByIdAsync(id);
        return d == null ? NotFound() : Ok(d);
    }

    // POST /api/demandes-conge — Créer/brouillon (Employé)
    [HttpPost]
    [Authorize(Roles = "employe,n1")]
    public async Task<IActionResult> Create([FromBody] CreateCongeDto dto)
    {
        var (result, error) = await _svc.CreateAsync(dto);
        if (error != null) return BadRequest(new { message = error });
        return CreatedAtAction(nameof(GetById), new { id = result!.Id },
            new { result.Id, result.Statut, result.DureeJours });
    }

    // GET /api/demandes-conge/{id}/historique
    [HttpGet("{id}/historique")]
    public async Task<IActionResult> GetHistorique(int id)
    {
        var logs = await _svc.GetHistoriqueAsync(id);
        return Ok(logs);
    }

    // ── Workflow endpoints ────────────────────────────────────────────────────

    // POST /api/demandes-conge/{id}/valider-n1
    [HttpPost("{id}/valider-n1")]
    [Authorize(Roles = "n1,admin")]
    public async Task<IActionResult> ValiderN1(int id, [FromBody] WorkflowActionDto action)
    {
        var (ok, err) = await _svc.ValiderN1Async(id, action);
        return ok ? Ok(new { message = "Demande transmise à la DG." }) : BadRequest(new { message = err });
    }

    // POST /api/demandes-conge/{id}/rejeter-n1
    [HttpPost("{id}/rejeter-n1")]
    [Authorize(Roles = "n1,admin")]
    public async Task<IActionResult> RejeterN1(int id, [FromBody] WorkflowActionDto action)
    {
        var (ok, err) = await _svc.RejeterN1Async(id, action);
        return ok ? Ok(new { message = "Demande rejetée." }) : BadRequest(new { message = err });
    }

    // POST /api/demandes-conge/{id}/valider-dg
    [HttpPost("{id}/valider-dg")]
    [Authorize(Roles = "dg,admin")]
    public async Task<IActionResult> ValiderDG(int id, [FromBody] WorkflowActionDto action)
    {
        var (ok, err) = await _svc.ValiderDGAsync(id, action);
        return ok ? Ok(new { message = "Demande transmise à la RH." }) : BadRequest(new { message = err });
    }

    // POST /api/demandes-conge/{id}/rejeter-dg
    [HttpPost("{id}/rejeter-dg")]
    [Authorize(Roles = "dg,admin")]
    public async Task<IActionResult> RejeterDG(int id, [FromBody] WorkflowActionDto action)
    {
        var (ok, err) = await _svc.RejeterDGAsync(id, action);
        return ok ? Ok(new { message = "Demande rejetée." }) : BadRequest(new { message = err });
    }

    // POST /api/demandes-conge/{id}/cloturer
    [HttpPost("{id}/cloturer")]
    [Authorize(Roles = "rh,admin")]
    public async Task<IActionResult> CloturerRH(int id, [FromBody] WorkflowActionDto action)
    {
        var (ok, err) = await _svc.CloturerRHAsync(id, action);
        return ok ? Ok(new { message = "Demande clôturée, solde débité." }) : BadRequest(new { message = err });
    }

    // POST /api/demandes-conge/{id}/annuler
    [HttpPost("{id}/annuler")]
    public async Task<IActionResult> Annuler(int id, [FromBody] WorkflowActionDto action)
    {
        var (ok, err) = await _svc.AnnulerAsync(id, action);
        return ok ? Ok(new { message = "Demande annulée." }) : BadRequest(new { message = err });
    }
}