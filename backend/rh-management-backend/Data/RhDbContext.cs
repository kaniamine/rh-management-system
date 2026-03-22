using Microsoft.EntityFrameworkCore;
using rh_management_backend.Models;

namespace rh_management_backend.Data;

public class RhDbContext : DbContext
{
    public RhDbContext(DbContextOptions<RhDbContext> options) : base(options) { }

    public DbSet<DemandeConge> DemandesConges => Set<DemandeConge>();
}
