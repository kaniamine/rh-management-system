namespace rh_management_backend.Services;

public interface ISmsService
{
    Task SendAsync(string toPhoneNumber, string message);
}
