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
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    /// POST /api/auth/login
    /// Body: { "matricule": "EMP001", "password": "0000" }
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _auth.LoginAsync(dto);
        if (result == null)
            return Unauthorized(new { message = "Matricule ou mot de passe incorrect." });

        return Ok(result);
    }

    /// POST /api/auth/change-password
    [HttpPost("change-password")]
    [Authorize(Roles = "employe,n1,dg")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var matricule = User.FindFirstValue("matricule");
        if (string.IsNullOrEmpty(matricule))
            return Unauthorized();

        var (ok, error) = await _auth.ChangePasswordAsync(matricule, dto);
        if (!ok)
            return BadRequest(new { message = error });

        return Ok(new { message = "Mot de passe modifié avec succès." });
    }
}