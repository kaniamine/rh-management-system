// IAuthService.cs
using rh_management_backend.DTOs.Auth;

namespace rh_management_backend.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginDto dto);
}