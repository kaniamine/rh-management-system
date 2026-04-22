// AuthService.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using rh_management_backend.Data;
using rh_management_backend.DTOs.Auth;

namespace rh_management_backend.Services;

public class AuthService : IAuthService
{
    private readonly RhDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(RhDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginDto dto)
    {
        Console.WriteLine($"[LOGIN] Looking for matricule: {dto.Matricule}");

        var user = await _db.Users
            .Include(u => u.Employe)
            .FirstOrDefaultAsync(u => u.Matricule == dto.Matricule && u.IsActive);

        Console.WriteLine($"[LOGIN] User found: {user != null}");
        if (user == null) return null;

        var passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        Console.WriteLine($"[LOGIN] Password valid: {passwordValid}");
        if (!passwordValid) return null;

        Console.WriteLine($"[LOGIN] Employe loaded: {user.Employe != null}");
        if (user.Employe == null)
        {
            Console.WriteLine($"[LOGIN] ERROR: Employe navigation property is null for user {user.Matricule}");
            return null;
        }

        user.NombreConnexions++;
        await _db.SaveChangesAsync();
        Console.WriteLine($"[LOGIN] NombreConnexions incremented to {user.NombreConnexions}");

        var token = GenerateJwtToken(user.Matricule, user.Role);
        var expires = DateTime.UtcNow.AddMinutes(
            _config.GetValue<int>("Jwt:ExpiresInMinutes", 480));

        var prenom = user.Employe.Prenom ?? string.Empty;
        var nom = user.Employe.Nom ?? string.Empty;
        var initiales = (prenom.Length > 0 && nom.Length > 0)
            ? $"{prenom[0]}{nom[0]}".ToUpper()
            : (prenom + nom).ToUpper();

        Console.WriteLine($"[LOGIN] Returning response for {user.Matricule} / role={user.Role}");

        return new LoginResponseDto(
            Matricule: user.Matricule,
            Role: user.Role,
            NomComplet: user.Employe.NomComplet,
            Initiales: initiales,
            Direction: user.Employe.Direction ?? string.Empty,
            Service: user.Employe.Service ?? string.Empty,
            Fonction: user.Employe.Fonction ?? string.Empty,
            SoldeConges: user.Employe.SoldeConges,
            SuperieurHierarchiqueMatricule: user.Employe.SuperieurHierarchiqueMatricule,
            Token: token,
            ExpiresAt: expires,
            PremiereConnexion: user.PremiereConnexion,
            NombreConnexions: user.NombreConnexions
        );
    }

    public async Task<bool> ChangePasswordAsync(ChangePasswordDto dto)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Matricule == dto.Matricule && u.IsActive);

        if (user == null) return false;
        if (!BCrypt.Net.BCrypt.Verify(dto.AncienMotDePasse, user.PasswordHash)) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NouveauMotDePasse);
        user.PremiereConnexion = false;
        await _db.SaveChangesAsync();
        return true;
    }

    private string GenerateJwtToken(string matricule, string role)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, matricule),
            new Claim(ClaimTypes.Role, role),
            new Claim("matricule", matricule)
        };

        var expires = DateTime.UtcNow.AddMinutes(
            _config.GetValue<int>("Jwt:ExpiresInMinutes", 480));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}