using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy
            .WithOrigins("http://localhost:4200", "https://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<RhDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAngular");
app.UseHttpsRedirection();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RhDbContext>();
    db.Database.Migrate();
}

app.MapPost("/api/demandes-conge", async (CreateDemandeCongeDto dto, RhDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(dto.NomComplet)
        || string.IsNullOrWhiteSpace(dto.Matricule)
        || string.IsNullOrWhiteSpace(dto.TypeConge))
    {
        return Results.BadRequest(new { message = "Nom, matricule et type de congé sont obligatoires." });
    }

    if (dto.DateFin < dto.DateDebut)
    {
        return Results.BadRequest(new { message = "La date de fin doit être après la date de début." });
    }

    if (dto.DureeJours < 1)
    {
        return Results.BadRequest(new { message = "La durée doit être d'au moins 1 jour." });
    }

    var entity = new DemandeConge
    {
        NomComplet = dto.NomComplet.Trim(),
        Matricule = dto.Matricule.Trim(),
        GradeFonction = string.IsNullOrWhiteSpace(dto.GradeFonction) ? null : dto.GradeFonction.Trim(),
        TypeConge = dto.TypeConge.Trim(),
        DateDebut = dto.DateDebut,
        DateFin = dto.DateFin,
        DureeJours = dto.DureeJours,
        Motif = string.IsNullOrWhiteSpace(dto.Motif) ? null : dto.Motif.Trim(),
        AdressePendantConge = string.IsNullOrWhiteSpace(dto.AdressePendantConge) ? null : dto.AdressePendantConge.Trim(),
        Telephone = string.IsNullOrWhiteSpace(dto.Telephone) ? null : dto.Telephone.Trim(),
        Statut = "En attente",
        CreatedAt = DateTime.UtcNow
    };

    db.DemandesConges.Add(entity);
    await db.SaveChangesAsync();

    return Results.Created($"/api/demandes-conge/{entity.Id}", new DemandeCongeResponse(entity.Id, entity.Statut));
})
.WithName("CreateDemandeConge");

app.MapGet("/api/demandes-conge/{id:int}", async (int id, RhDbContext db) =>
{
    var d = await db.DemandesConges.FindAsync(id);
    return d is null ? Results.NotFound() : Results.Ok(d);
})
.WithName("GetDemandeCongeById");

app.Run();

internal record CreateDemandeCongeDto(
    string NomComplet,
    string Matricule,
    string? GradeFonction,
    string TypeConge,
    DateOnly DateDebut,
    DateOnly DateFin,
    int DureeJours,
    string? Motif,
    string? AdressePendantConge,
    string? Telephone);

internal record DemandeCongeResponse(int Id, string Statut);
