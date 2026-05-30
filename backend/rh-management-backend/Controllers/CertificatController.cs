using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace rh_management_backend.Controllers;

[ApiController]
[Route("api/certificat")]
[Authorize]
public class CertificatController : ControllerBase
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;

    public CertificatController(IHttpClientFactory http, IConfiguration config)
    {
        _http   = http;
        _config = config;
    }

    [HttpPost("valider")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Valider([FromForm] IFormFile fichier)
    {
        if (fichier == null || fichier.Length == 0)
            return BadRequest(new { message = "Aucun fichier fourni." });

        var contentType = fichier.ContentType.ToLower();

        if (contentType == "application/pdf")
            return Ok(new { valide = false, message = "❌ Les PDF ne sont pas supportés. Envoyez une image JPG ou PNG." });

        var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png" };
        if (!allowedTypes.Contains(contentType))
            return BadRequest(new { message = "Format non supporté. Utilisez JPG ou PNG." });

        Console.WriteLine("[CERTIFICAT] ===== START =====");
        Console.WriteLine($"[CERTIFICAT] File: {fichier.FileName} | Size: {fichier.Length} bytes");

        var apiKey = _config["Groq:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "YOUR_GROQ_API_KEY")
        {
            Console.WriteLine("[CERTIFICAT] API key not configured — rejecting.");
            return Ok(new { valide = false, message = "❌ Clé API non configurée." });
        }

        using var ms = new MemoryStream();
        await fichier.CopyToAsync(ms);
        var base64 = Convert.ToBase64String(ms.ToArray());

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));

        try
        {
            var client = _http.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", apiKey);

            var payload = new
            {
                model = "meta-llama/llama-4-scout-17b-16e-instruct",
                messages = new[]
                {
                    new
                    {
                        role    = "user",
                        content = new object[]
                        {
                            new
                            {
                                type = "text",
                                text = "Analyse this document image. Is it a legitimate medical certificate issued by a doctor (contains a medical diagnosis, doctor signature, or sick leave notice)? Reply ONLY with valid JSON, no extra text: {\"isMedical\": true or false, \"reason\": \"brief explanation\"}"
                            },
                            new
                            {
                                type      = "image_url",
                                image_url = new { url = $"data:{contentType};base64,{base64}" }
                            }
                        }
                    }
                },
                max_tokens  = 200,
                temperature = 0
            };

            Console.WriteLine("[CERTIFICAT] Calling Groq vision API...");

            var response = await client.PostAsync(
                "https://api.groq.com/openai/v1/chat/completions",
                new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"),
                cts.Token);

            Console.WriteLine($"[CERTIFICAT] Groq HTTP status: {(int)response.StatusCode}");

            var raw = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[CERTIFICAT] Groq error: {raw}");
                return Ok(new { valide = false, message = "❌ Erreur lors de l'analyse. Réessayez." });
            }

            using var doc = JsonDocument.Parse(raw);
            var aiText = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "";

            Console.WriteLine($"[CERTIFICAT] AI text: {aiText}");

            var jsonStart = aiText.IndexOf('{');
            var jsonEnd   = aiText.LastIndexOf('}');

            if (jsonStart < 0 || jsonEnd <= jsonStart)
            {
                Console.WriteLine("[CERTIFICAT] Could not locate JSON in AI response — rejecting.");
                return Ok(new { valide = false, message = "❌ Erreur lors de l'analyse. Réessayez." });
            }

            using var aiDoc   = JsonDocument.Parse(aiText[jsonStart..(jsonEnd + 1)]);
            var root          = aiDoc.RootElement;
            var isMedical     = root.TryGetProperty("isMedical", out var v) && v.GetBoolean();

            Console.WriteLine($"[CERTIFICAT] Result: isMedical={isMedical}");

            return Ok(new
            {
                valide  = isMedical,
                message = isMedical
                    ? "✅ Certificat médical validé par l'IA."
                    : "❌ Ce document n'est pas un certificat médical valide."
            });
        }
        catch (TaskCanceledException)
        {
            Console.WriteLine("[CERTIFICAT] Timeout — rejecting");
            return Ok(new { valide = false, message = "❌ Délai d'analyse dépassé. Réessayez." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CERTIFICAT] Exception: {ex.Message}");
            return Ok(new { valide = false, message = "❌ Erreur lors de l'analyse. Réessayez." });
        }
    }
}
