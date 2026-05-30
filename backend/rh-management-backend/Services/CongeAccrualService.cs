using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using rh_management_backend.Data;

namespace rh_management_backend.Services;

public sealed class CongeAccrualService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CongeAccrualService> _logger;

    public CongeAccrualService(
        IServiceScopeFactory scopeFactory,
        ILogger<CongeAccrualService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = ComputeDelayUntilNextFirst();
            _logger.LogInformation("[CongeAccrual] Prochain accrual dans {Delay}", delay);

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            if (!stoppingToken.IsCancellationRequested)
                await RunAccrualAsync(stoppingToken);
        }
    }

    public async Task<int> RunAccrualAsync(CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db          = scope.ServiceProvider.GetRequiredService<RhDbContext>();

        var employes = await db.Employes
            .Where(e => e.IsActive)
            .ToListAsync(ct);

        // +2.5 j/mois : SoldeConges étant int, on alterne +2 (mois pairs) et +3 (mois impairs)
        // → 6×2 + 6×3 = 30 j/an = exactement 2,5 j/mois en moyenne.
        int increment = DateTime.UtcNow.Month % 2 == 0 ? 3 : 2;

        foreach (var e in employes)
        {
            e.SoldeConges      += increment;
            e.SoldeCongesJours += increment;
        }

        await db.SaveChangesAsync(ct);
        _logger.LogInformation(
            "[CongeAccrual] +{Inc} j appliqués à {Count} employés (mois {Month})",
            increment, employes.Count, DateTime.UtcNow.Month);

        return employes.Count;
    }

    private static TimeSpan ComputeDelayUntilNextFirst()
    {
        var now  = DateTime.UtcNow;
        var next = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);
        return next - now;
    }
}
