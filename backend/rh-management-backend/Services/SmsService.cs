using System.Net.Http.Headers;
using System.Text;

namespace rh_management_backend.Services;

public class SmsService : ISmsService
{
    private readonly IHttpClientFactory _factory;
    private readonly IConfiguration _config;
    private readonly ILogger<SmsService> _logger;

    public SmsService(IHttpClientFactory factory, IConfiguration config, ILogger<SmsService> logger)
    {
        _factory = factory;
        _config  = config;
        _logger  = logger;
    }

    public async Task SendAsync(string toPhoneNumber, string message)
    {
        var accountSid = _config["Twilio:AccountSid"];
        var authToken  = _config["Twilio:AuthToken"];
        var fromNumber = _config["Twilio:FromNumber"];

        Console.WriteLine($"[SMS] AccountSid present: {!string.IsNullOrEmpty(accountSid)}");
        Console.WriteLine($"[SMS] AuthToken present:  {!string.IsNullOrEmpty(authToken)}");
        Console.WriteLine($"[SMS] FromNumber: {fromNumber}");
        Console.WriteLine($"[SMS] Sending to: {toPhoneNumber}");

        if (string.IsNullOrEmpty(accountSid))
        {
            _logger.LogWarning("Twilio AccountSid is not configured — SMS skipped.");
            return;
        }

        var url = $"https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json";

        var credentials = Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{accountSid}:{authToken}"));

        using var http = _factory.CreateClient();
        http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", credentials);

        var formData = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("From", fromNumber ?? string.Empty),
            new KeyValuePair<string, string>("To",   toPhoneNumber),
            new KeyValuePair<string, string>("Body", message)
        });

        var response = await http.PostAsync(url, formData);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            Console.WriteLine("[SMS] ✅ SendAsync completed.");
            _logger.LogInformation("SMS sent to {To}.", toPhoneNumber);
        }
        else
        {
            Console.Error.WriteLine($"[SMS ERROR] Twilio returned {(int)response.StatusCode}: {responseBody}");
            _logger.LogWarning("Twilio returned {StatusCode}: {Body}", response.StatusCode, responseBody);
        }
    }
}
