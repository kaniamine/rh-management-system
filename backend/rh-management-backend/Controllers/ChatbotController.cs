using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/chatbot")]
[Authorize]
public class ChatbotController : ControllerBase
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;

    public ChatbotController(
        IHttpClientFactory http,
        IConfiguration config)
    {
        _http   = http;
        _config = config;
    }

    [HttpPost("message")]
    public async Task<IActionResult> SendMessage(
        [FromBody] JsonElement body)
    {
        try
        {
            var apiKey = _config["Groq:ApiKey"];

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                Console.WriteLine("[CHATBOT] Groq API key not configured");
                return BadRequest(new { error = "Chatbot non configuré." });
            }

            Console.WriteLine("[CHATBOT] Calling Groq API...");

            var client = _http.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", apiKey);

            // Replace model name with Groq model
            var bodyDict = JsonSerializer
                .Deserialize<Dictionary<string, JsonElement>>(
                    body.GetRawText());

            if (bodyDict != null)
                bodyDict["model"] = JsonSerializer
                    .SerializeToElement("llama-3.1-8b-instant");

            var payload = JsonSerializer.Serialize(bodyDict);
            var content = new StringContent(
                payload,
                Encoding.UTF8,
                "application/json");

            var response = await client.PostAsync(
                "https://api.groq.com/openai/v1/chat/completions",
                content);

            var result = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"[CHATBOT] Groq status: {(int)response.StatusCode}");

            if (!response.IsSuccessStatusCode)
                Console.WriteLine($"[CHATBOT] Groq error: {result}");

            return Content(result, "application/json");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CHATBOT ERROR] {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
