using Microsoft.AspNetCore.Mvc;
using rh_management_backend.Models;
using rh_management_backend.Repositories;

namespace rh_management_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DemandeCongeController : ControllerBase
    {
        private readonly DemandeCongeRepository _repo;

        public DemandeCongeController(DemandeCongeRepository repo)
        {
            _repo = repo;
        }

        // ✅ Créer une demande
        [HttpPost]
        public IActionResult Create([FromBody] DemandeConge demande)
        {
            // 🔴 Vérification dates
            if (demande.DateDebut == default || demande.DateFin == default)
                return BadRequest("Dates obligatoires");

            if (demande.DateFin < demande.DateDebut)
                return BadRequest("Date fin invalide");

            // 🔴 Calcul durée
            int duree = (demande.DateFin - demande.DateDebut).Days + 1;

            // 🔴 Vérification solde
            

            // ✅ Initialisation
            
            demande.Statut = "En attente de validation N+1";
            

            _repo.Add(demande);

            return Ok(demande);
        }

        // ✅ Récupérer toutes les demandes
        [HttpGet]
        public IActionResult GetAll()
        {
            var demandes = _repo.GetAll();
            return Ok(demandes);
        }

        // ✅ Récupérer par ID
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var demande = _repo.GetById(id);

            if (demande == null)
                return NotFound("Demande non trouvée");

            return Ok(demande);
        }

        // ✅ Validation N+1 → envoie vers DG
        [HttpPut("valider/{id}")]
        public IActionResult Valider(int id)
        {
            var demande = _repo.GetById(id);

            if (demande == null)
                return NotFound("Demande introuvable");

            demande.Statut = "En attente de validation DG";

            _repo.Update(demande);

            return Ok(demande);
        }

        // ✅ Validation finale DG
        [HttpPut("valider-dg/{id}")]
        public IActionResult ValiderDG(int id)
        {
            var demande = _repo.GetById(id);

            if (demande == null)
                return NotFound("Demande introuvable");

            demande.Statut = "Validée";

            _repo.Update(demande);

            return Ok(demande);
        }

        // ✅ Rejet avec motif
        [HttpPut("rejeter/{id}")]
        public IActionResult Rejeter(int id, [FromBody] string motif)
        {
            var demande = _repo.GetById(id);

            if (demande == null)
                return NotFound("Demande introuvable");

            if (string.IsNullOrEmpty(motif))
                return BadRequest("Motif obligatoire");

            demande.Statut = "Rejetée";
            demande.MotifRejet = motif;

            _repo.Update(demande);

            return Ok(demande);
        }

        // ✅ Supprimer
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var demande = _repo.GetById(id);

            if (demande == null)
                return NotFound("Demande introuvable");

            _repo.Delete(id);

            return Ok("Supprimée avec succès");
        }
    }
}