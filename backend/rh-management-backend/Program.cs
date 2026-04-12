using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using rh_management_backend.Data;
using rh_management_backend.Middleware;
using rh_management_backend.Services;

var builder = WebApplication.CreateBuilder(args);

// ── JSON ──────────────────────────────────────────────────────────────────────
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// ── SWAGGER / OpenAPI ─────────────────────────────────────────────────────────
builder.Services.AddOpenApi();

// ── CORS ──────────────────────────────────────────────────────────────────────
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

// ── DATABASE ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<RhDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── JWT AUTHENTICATION ────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ── INJECTION DE DÉPENDANCES (Services) ──────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDemandeCongeService, DemandeCongeService>();
// Ajouter les autres services ici au fur et à mesure :
// builder.Services.AddScoped<IDemandeAutorisationService, DemandeAutorisationService>();
// builder.Services.AddScoped<IDemandeMaladieService, DemandeMaladieService>();

// ── BUILD ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── PIPELINE ──────────────────────────────────────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();  // ← gestion globale erreurs

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors("AllowAngular");
app.UseAuthentication();   // ← JWT avant Authorization
app.UseAuthorization();

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

// ── AUTO-MIGRATION ────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RhDbContext>();
    db.Database.Migrate();
}


Console.WriteLine(BCrypt.Net.BCrypt.HashPassword("0000"));

app.MapControllers();
app.Run();