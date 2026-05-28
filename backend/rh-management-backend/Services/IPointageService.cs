using rh_management_backend.DTOs.Pointage;

namespace rh_management_backend.Services;

public interface IPointageService
{
    Task<List<PointageDto>> GetMonHistoriqueAsync(string matricule);
    Task<PointageDto>       GetAujourdhuiAsync(string matricule);
    Task<PointageDto>       PointerEntreeAsync(string matricule);
    Task<PointageDto>       PointerSortieAsync(string matricule);
    Task                    HeartbeatAsync(string matricule);
}
