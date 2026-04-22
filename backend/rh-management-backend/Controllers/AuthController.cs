using Microsoft.AspNetCore.Mvc;
using rh_management_backend.DTOs.Auth;
using rh_management_backend.Services;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (dto == null)
            return BadRequest(new { message = "Requete invalide." });

        if (string.IsNullOrWhiteSpace(dto.Matricule) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Matricule et mot de passe obligatoires." });

        var result = await _authService.LoginAsync(dto);

        if (result == null)
            return Unauthorized(new { message = "Matricule ou mot de passe incorrect." });

        return Ok(result);
    }

    [HttpPost("changer-mot-de-passe")]
    public async Task<IActionResult> ChangerMotDePasse([FromBody] ChangePasswordDto dto)
    {
        if (dto == null)
            return BadRequest(new { message = "Requête invalide." });

        if (string.IsNullOrWhiteSpace(dto.Matricule) ||
            string.IsNullOrWhiteSpace(dto.AncienMotDePasse) ||
            string.IsNullOrWhiteSpace(dto.NouveauMotDePasse))
            return BadRequest(new { message = "Tous les champs sont obligatoires." });

        var success = await _authService.ChangePasswordAsync(dto);
        if (!success)
            return BadRequest(new { message = "Matricule ou mot de passe incorrect." });

        return Ok(new { message = "Mot de passe mis à jour avec succès." });
    }

    [HttpGet("hashtest")]
    public IActionResult HashTest([FromQuery] string pwd = "0000")
    {
        var hash = BCrypt.Net.BCrypt.HashPassword(pwd);
        return Ok(new { password = pwd, hash });
    }
}