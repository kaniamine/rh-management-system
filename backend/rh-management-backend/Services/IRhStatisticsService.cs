using rh_management_backend.DTOs.Statistics;

namespace rh_management_backend.Services;

public interface IRhStatisticsService
{
    Task<OverviewStatsDto> GetOverviewAsync(int? annee, int? mois);
    Task<CongeStatsDto> GetCongeStatsAsync(int? annee, int? mois);
    Task<MaladieStatsDto> GetMaladieStatsAsync(int? annee, int? mois);
    Task<AutorisationStatsDto> GetAutorisationStatsAsync(int? annee, int? mois);
}
