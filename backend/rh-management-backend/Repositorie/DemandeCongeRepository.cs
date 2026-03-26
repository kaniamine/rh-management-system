using rh_management_backend.Models;

namespace rh_management_backend.Repositories
{
    public class DemandeCongeRepository 
    {
        private static List<DemandeConge> demandes = new List<DemandeConge>();

        public List<DemandeConge> GetAll()
        {
            return demandes;
        }

        public DemandeConge GetById(int id)
        {
            return demandes.FirstOrDefault(d => d.Id == id);
        }

        public void Add(DemandeConge demande)
        {
            demande.Id = demandes.Count + 1;
            demandes.Add(demande);
        }

        public void Update(DemandeConge demande)
        {
            var existing = GetById(demande.Id);
            if (existing != null)
            {
                existing.DateDebut = demande.DateDebut;
                existing.DateFin = demande.DateFin;
                existing.Statut = demande.Statut;
            }
        }

        public void Delete(int id)
        {
            var demande = GetById(id);
            if (demande != null)
            {
                demandes.Remove(demande);
            }
        }
    }
}