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
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash)) return null;

        var token = GenerateJwtToken(user.Matricule, user.Role);
        var expires = DateTime.UtcNow.AddMinutes(
            _config.GetValue<int>("Jwt:ExpiresInMinutes", 480));

        return new LoginResponseDto(
            Matricule: user.Matricule,
            Role: user.Role,
            NomComplet: user.Employe.NomComplet,
            Initiales: $"{user.Employe.Prenom[0]}{user.Employe.Nom[0]}".ToUpper(),
            Direction: user.Employe.Direction,
            Service: user.Employe.Service,
            Fonction: user.Employe.Fonction,
            SoldeConges: user.Employe.SoldeConges,
            SuperieurHierarchiqueMatricule: user.Employe.SuperieurHierarchiqueMatricule,
            Token: token,
            ExpiresAt: expires,
            MustChangePassword: user.MustChangePassword
        );
    }

    public async Task<(bool ok, string? error)> ChangePasswordAsync(string matricule, ChangePasswordDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Matricule == matricule && u.IsActive);
        if (user == null)
            return (false, "Utilisateur introuvable.");

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return (false, "Mot de passe actuel incorrect.");

        if (dto.CurrentPassword == dto.NewPassword)
            return (false, "Le nouveau mot de passe doit être différent du mot de passe actuel.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
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