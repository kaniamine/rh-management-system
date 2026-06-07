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
        var user = await _db.Users
            .Include(u => u.Employe)
            .FirstOrDefaultAsync(u => u.Matricule == dto.Matricule && u.IsActive);

        if (user == null) return null;

        if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 3)
            {
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(5);
                user.FailedLoginAttempts = 0;
            }
            await _db.SaveChangesAsync();
            return null;
        }

        if (user.Employe == null) return null;

        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;
        user.NombreConnexions++;
        await _db.SaveChangesAsync();

        var token = GenerateJwtToken(user.Matricule, user.Role);
        var expires = DateTime.UtcNow.AddMinutes(
            _config.GetValue<int>("Jwt:ExpiresInMinutes", 480));

        var prenom = user.Employe.Prenom ?? string.Empty;
        var nom = user.Employe.Nom ?? string.Empty;
        var initiales = (prenom.Length > 0 && nom.Length > 0)
            ? $"{prenom[0]}{nom[0]}".ToUpper()
            : (prenom + nom).ToUpper();

        return new LoginResponseDto(
            Id: user.Id,
            Matricule: user.Matricule,
            Role: user.Role,
            Nom: nom,
            Prenom: prenom,
            NomComplet: user.Employe.NomComplet,
            Initiales: initiales,
            Direction: user.Employe.Direction ?? string.Empty,
            Service: user.Employe.Service ?? string.Empty,
            Fonction: user.Employe.Fonction ?? string.Empty,
            SoldeConges: user.Employe.SoldeConges,
            SuperieurHierarchiqueMatricule: user.Employe.SuperieurHierarchiqueMatricule,
            Token: token,
            ExpiresAt: expires,
            MustChangePassword: user.MustChangePassword,
            NombreConnexions: user.NombreConnexions
        );
    }

    public async Task<(bool ok, string? error)> ChangePasswordAsync(string matricule, ChangePasswordDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Matricule == matricule && u.IsActive);
        if (user == null)
            return (false, "Utilisateur introuvable.");

        Console.WriteLine($"[CHANGE-PWD] matricule={matricule}");
        Console.WriteLine($"[CHANGE-PWD] CurrentPassword='{dto.CurrentPassword}'");
        Console.WriteLine($"[CHANGE-PWD] NewPassword length={dto.NewPassword?.Length}");

        var verified = BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash);
        Console.WriteLine($"[CHANGE-PWD] BCrypt.Verify={verified}");

        if (!verified)
            return (false, "Mot de passe actuel incorrect.");

        if (dto.CurrentPassword == dto.NewPassword)
            return (false, "Le nouveau mot de passe doit être différent du mot de passe actuel.");

        user.PasswordHash       = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword, 10);
        user.MustChangePassword = false;
        await _db.SaveChangesAsync();

        return (true, null);
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
