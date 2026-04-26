using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
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
    [HttpPost("change-password")]
    [Authorize(Roles = "employe,n1,dg,rh,admin")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var matricule = User.FindFirstValue("matricule");
        if (string.IsNullOrEmpty(matricule))
            return Unauthorized();

        var (ok, error) = await _authService.ChangePasswordAsync(matricule, dto);
        if (!ok)
            return BadRequest(new { message = error });

        return Ok(new { message = "Mot de passe modifié avec succès." });
    }

    [HttpGet("hashtest")]
    public IActionResult HashTest([FromQuery] string pwd = "0000")
    {
        var hash = BCrypt.Net.BCrypt.HashPassword(pwd);
        return Ok(new { password = pwd, hash });
    }
}
