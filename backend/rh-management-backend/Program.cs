using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.Models;
using rh_management_backend.Repositories;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IDemandeCongeRepository, DemandeCongeRepository>();

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
    if (string.IsNullOrWhiteSpace(dto.TypeConge))
    {
        return Results.BadRequest(new { message = "Le type de congé est obligatoire." });
    }

    if (dto.DateDebut == default || dto.DateFin == default)
    {
        return Results.BadRequest(new { message = "Les dates de début et de fin sont obligatoires." });
    }

    if (dto.DateFin < dto.DateDebut)
    {
        return Results.BadRequest(new { message = "La date de fin doit être après ou égale à la date de début." });
    }

    var typeDuree = string.IsNullOrWhiteSpace(dto.TypeDuree) ? "Journée entière" : dto.TypeDuree.Trim();
    var demiJournee = typeDuree.Contains("Demi", StringComparison.OrdinalIgnoreCase);

    if (demiJournee && dto.DateDebut != dto.DateFin)
    {
        return Results.BadRequest(new { message = "Pour une demi-journée, la date de début et de fin doivent être le même jour." });
    }

    if (!dto.EstBrouillon)
    {
        if (string.IsNullOrWhiteSpace(dto.NomComplet) || string.IsNullOrWhiteSpace(dto.Matricule))
        {
            return Results.BadRequest(new { message = "Le nom complet et le matricule sont obligatoires pour une soumission." });
        }

        if (string.IsNullOrWhiteSpace(dto.Motif))
        {
            return Results.BadRequest(new { message = "Le motif est obligatoire pour soumettre la demande." });
        }
    }

    var dureeJours = ComputeDureeJours(dto.DateDebut, dto.DateFin, demiJournee);
    if (dureeJours < 1)
    {
        return Results.BadRequest(new { message = "Durée invalide." });
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

static int ComputeDureeJours(DateOnly debut, DateOnly fin, bool demiJournee)
{
    var joursCalendaires = fin.DayNumber - debut.DayNumber + 1;
    if (joursCalendaires < 1)
    {
        return 0;
    }

    if (demiJournee)
    {
        return 1;
    }

    return joursCalendaires;
}

static string? NullIfWhiteSpace(string? s) =>
    string.IsNullOrWhiteSpace(s) ? null : s.Trim();

public record CreateDemandeCongeDto(
    string TypeConge,
    DateOnly DateDebut,
    DateOnly DateFin,
    bool EstBrouillon,
    string? NomComplet = null,
    string? Matricule = null,
    string? Service = null,
    string? SuperieurHierarchique = null,
    string? GradeFonction = null,
    string? TypeDuree = null,
    string? Motif = null,
    string? AdressePendantConge = null,
    string? Telephone = null,
    string? PieceJustificativeFichierNom = null);


internal record DemandeCongeResponse(int Id, string Statut);

 