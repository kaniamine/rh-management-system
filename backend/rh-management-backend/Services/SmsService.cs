using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

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
        var apiKey  = _config["Infobip:ApiKey"];
        var baseUrl = _config["Infobip:BaseUrl"];
        var sender  = _config["Infobip:Sender"] ?? "AlBaraka";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("Infobip ApiKey is not configured — SMS skipped.");
            return;
        }

        var url = $"{baseUrl}/sms/2/text/advanced";

        var payload = new
        {
            messages = new[]
            {
                new
                {
                    from = sender,
                    destinations = new[] { new { to = toPhoneNumber } },
                    text = message
                }
            }
        };

        using var http = _factory.CreateClient();
        http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("App", apiKey);

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        var response = await http.PostAsync(url, content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            _logger.LogInformation("SMS sent to {To} via Infobip.", toPhoneNumber);
        }
        else
        {
            var msg = $"Infobip a retourné {(int)response.StatusCode}: {responseBody}";
            _logger.LogWarning(msg);
            throw new HttpRequestException(msg);
        }
    }
}
