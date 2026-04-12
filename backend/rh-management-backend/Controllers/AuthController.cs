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
}