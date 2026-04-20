using Microsoft.EntityFrameworkCore;
using rh_management_backend.Models;

namespace rh_management_backend.Data;

public class RhDbContext : DbContext
{
    public RhDbContext(DbContextOptions<RhDbContext> options) : base(options) { }

    public DbSet<Employe> Employes => Set<Employe>();
    public DbSet<User> Users => Set<User>();
    public DbSet<DemandeConge> DemandesConges => Set<DemandeConge>();
    public DbSet<DemandeAutorisation> DemandesAutorisations => Set<DemandeAutorisation>();
    public DbSet<DemandeMaladie> DemandesMaladie => Set<DemandeMaladie>();
    public DbSet<HistoriqueAction> HistoriqueActions => Set<HistoriqueAction>();

    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Index unique sur matricule
        modelBuilder.Entity<Employe>().HasIndex(e => e.Matricule).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.Matricule).IsUnique();

        // ═══════════════════════════════════════════════════════════════════════
        // SEED DATA — 4 PROFILS DE TEST (mot de passe : 0000)
        // Hash BCrypt de "0000" — stable pour le seed
        // ═══════════════════════════════════════════════════════════════════════
        const string hash = "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lp02";

        // ── Employés ─────────────────────────────────────────────────────────
        modelBuilder.Entity<Employe>().HasData(
            new Employe
            {
                Id = 1,
                Matricule = "EMP001",
                Nom = "Ben Ali",
                Prenom = "Amine",
                Direction = "Direction Finance",
                Service = "Comptabilité",
                Fonction = "Comptable",
                SuperieurHierarchiqueMatricule = "SH001",
                SoldeConges = 22,
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Employe
            {
                Id = 2,
                Matricule = "SH001",
                Nom = "Chaabane",
                Prenom = "Leila",
                Direction = "Direction Finance",
                Service = "Comptabilité",
                Fonction = "Responsable Comptabilité",
                SuperieurHierarchiqueMatricule = "DG001",
                SoldeConges = 28,
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Employe
            {
                Id = 3,
                Matricule = "DG001",
                Nom = "Mansouri",
                Prenom = "Kamel",
                Direction = "Direction Générale",
                Service = "Direction Générale",
                Fonction = "Directeur Général",
                SuperieurHierarchiqueMatricule = null,
                SoldeConges = 30,
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Employe
            {
                Id = 4,
                Matricule = "RH001",
                Nom = "Trabelsi",
                Prenom = "Sonia",
                Direction = "Direction Ressources Humaines",
                Service = "Ressources Humaines",
                Fonction = "Responsable RH",
                SuperieurHierarchiqueMatricule = "DG001",
                SoldeConges = 30,
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        // ── Users ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, Matricule = "EMP001", PasswordHash = hash, Role = "employe", EmployeId = 1, IsActive = true, MustChangePassword = false, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new User { Id = 2, Matricule = "SH001", PasswordHash = hash, Role = "n1", EmployeId = 2, IsActive = true, MustChangePassword = false, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new User { Id = 3, Matricule = "DG001", PasswordHash = hash, Role = "dg", EmployeId = 3, IsActive = true, MustChangePassword = false, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new User { Id = 4, Matricule = "RH001", PasswordHash = hash, Role = "rh", EmployeId = 4, IsActive = true, MustChangePassword = false, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
    }
}