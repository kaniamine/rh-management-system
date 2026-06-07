using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using rh_management_backend.Data;
using rh_management_backend.Middleware;
using rh_management_backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Give in-flight requests up to 10 s to finish before the host force-stops.
builder.WebHost.UseShutdownTimeout(TimeSpan.FromSeconds(10));

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

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10 MB
});

// ── SWAGGER / OpenAPI ─────────────────────────────────────────────────────────
builder.Services.AddOpenApi();

// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("AllowedOrigins")
            .Get<string[]>()
            ?? ["http://localhost:4200", "https://localhost:4200", "http://localhost", "https://localhost"];

        policy
            .WithOrigins(allowedOrigins)
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
builder.Services.AddHttpClient();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IDemandeCongeService, DemandeCongeService>();
builder.Services.AddScoped<IRhStatisticsService, RhStatisticsService>();
builder.Services.AddHostedService<CongeAccrualService>();
builder.Services.AddScoped<IPointageService, PointageService>();

// ── BUILD ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── PIPELINE ──────────────────────────────────────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();  // ← gestion globale erreurs

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors("AllowFrontend");
app.UseAuthentication();   // ← JWT avant Authorization
app.UseAuthorization();

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

// ── AUTO-MIGRATION ────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RhDbContext>();
    db.Database.Migrate();

    // Convertit les anciens comptes "admin" en "rh" — le rôle admin est supprimé.
    var admins = db.Users.Where(u => u.Role == "admin").ToList();
    if (admins.Count > 0)
    {
        admins.ForEach(u => u.Role = "rh");
        db.SaveChanges();
        app.Logger.LogInformation("Migration admin→rh : {Count} compte(s) convertis.", admins.Count);
    }
}


app.MapControllers();

// Log clean start/stop so you can confirm the port is released on shutdown.
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStarted.Register(() =>
    app.Logger.LogInformation("Backend started on {Urls}", string.Join(", ", builder.WebHost.GetSetting("urls") ?? "http://localhost:5131")));
lifetime.ApplicationStopping.Register(() =>
    app.Logger.LogInformation("Backend shutting down — draining requests…"));
lifetime.ApplicationStopped.Register(() =>
    app.Logger.LogInformation("Backend stopped. Port released."));

app.Run();
