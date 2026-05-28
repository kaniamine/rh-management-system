using Microsoft.EntityFrameworkCore;
using rh_management_backend.Data;
using rh_management_backend.DTOs.Pointage;
using rh_management_backend.Models;

namespace rh_management_backend.Services;

public class PointageService : IPointageService
{
    private readonly RhDbContext _db;

    // Heure réglementaire d'arrivée en minutes depuis minuit (08:30 → 510)
    private const int HeureReglementaireMinutes = 8 * 60 + 30;

    // Fuseau horaire Tunisie (UTC+1, sans DST) — IANA sur Linux, Windows ID sinon
    private static readonly TimeZoneInfo TzTunisie = GetTunisiaTimeZone();

    private static TimeZoneInfo GetTunisiaTimeZone()
    {
        try   { return TimeZoneInfo.FindSystemTimeZoneById("Africa/Tunis"); }
        catch { return TimeZoneInfo.FindSystemTimeZoneById("W. Central Africa Standard Time"); }
    }

    public PointageService(RhDbContext db) => _db = db;

    // ── Historique ────────────────────────────────────────────────────────────

    public async Task<List<PointageDto>> GetMonHistoriqueAsync(string matricule)
    {
        var user = await GetUserAsync(matricule);
        if (user == null) return [];

        var records = await _db.Pointages
            .Where(p => p.UserId == user.Id)
            .OrderByDescending(p => p.Date)
            .Take(90)
            .ToListAsync();

        return records.Select(ToDto).ToList();
    }

    // ── Aujourd'hui ───────────────────────────────────────────────────────────

    public async Task<PointageDto> GetAujourdhuiAsync(string matricule)
    {
        var user = await GetUserAsync(matricule);
        if (user == null) return EmptyToday();

        var today  = DateAujourdhui();
        var record = await GetOrNullAsync(user.Id, today);
        return record == null ? EmptyToday() : ToDto(record);
    }

    // ── Pointer entrée ────────────────────────────────────────────────────────

    public async Task<PointageDto> PointerEntreeAsync(string matricule)
    {
        var user = await GetUserAsync(matricule);
        if (user == null) throw new InvalidOperationException("Utilisateur introuvable.");

        var today  = DateAujourdhui();
        var record = await GetOrNullAsync(user.Id, today);

        if (record?.HeureEntree != null)
            throw new InvalidOperationException("Entrée déjà enregistrée aujourd'hui.");

        var now = MaintentantUtc();

        if (record == null)
        {
            record = new Pointage { UserId = user.Id, Date = today };
            _db.Pointages.Add(record);
        }

        record.HeureEntree      = now;
        record.DernierHeartbeat = now;
        record.RetardMinutes    = CalculerRetard(now);
        record.Statut           = record.RetardMinutes > 0 ? "En retard" : "Présent";

        await _db.SaveChangesAsync();
        return ToDto(record);
    }

    // ── Pointer sortie ────────────────────────────────────────────────────────

    public async Task<PointageDto> PointerSortieAsync(string matricule)
    {
        var user = await GetUserAsync(matricule);
        if (user == null) throw new InvalidOperationException("Utilisateur introuvable.");

        var today  = DateAujourdhui();
        var record = await GetOrNullAsync(user.Id, today);

        if (record?.HeureEntree == null)
            throw new InvalidOperationException("Aucune entrée enregistrée aujourd'hui.");
        if (record.HeureSortie != null)
            throw new InvalidOperationException("Sortie déjà enregistrée aujourd'hui.");

        var now = MaintentantUtc();
        record.HeureSortie   = now;
        record.DureeMinutes  = (int)(now - record.HeureEntree.Value).TotalMinutes;
        record.Statut        = record.RetardMinutes > 0 ? "En retard" : "Présent";

        await _db.SaveChangesAsync();
        return ToDto(record);
    }

    // ── Heartbeat ─────────────────────────────────────────────────────────────

    public async Task HeartbeatAsync(string matricule)
    {
        var user = await GetUserAsync(matricule);
        if (user == null) return;

        var today  = DateAujourdhui();
        var record = await GetOrNullAsync(user.Id, today);

        if (record?.HeureEntree == null || record.HeureSortie != null) return;

        record.DernierHeartbeat = MaintentantUtc();
        await _db.SaveChangesAsync();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<User?> GetUserAsync(string matricule) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Matricule == matricule);

    private async Task<Pointage?> GetOrNullAsync(int userId, DateTime date) =>
        await _db.Pointages.FirstOrDefaultAsync(p => p.UserId == userId && p.Date == date);

    private static DateTime DateAujourdhui()
    {
        var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TzTunisie);
        return local.Date; // stocké en tant que date locale sans heure
    }

    private static DateTime MaintentantUtc() => DateTime.UtcNow;

    private static int CalculerRetard(DateTime heureEntreeUtc)
    {
        var local        = TimeZoneInfo.ConvertTimeFromUtc(heureEntreeUtc, TzTunisie);
        var minutesJour  = local.Hour * 60 + local.Minute;
        return Math.Max(0, minutesJour - HeureReglementaireMinutes);
    }

    private static PointageDto ToDto(Pointage p)
    {
        string? FormatHeure(DateTime? utc)
        {
            if (utc == null) return null;
            var local = TimeZoneInfo.ConvertTimeFromUtc(utc.Value, TzTunisie);
            return local.ToString("HH:mm");
        }

        string? FormatDuree(int? minutes)
        {
            if (minutes == null) return null;
            return $"{minutes / 60}h{minutes % 60:D2}";
        }

        string? FormatRetard(int? minutes)
        {
            if (minutes == null || minutes == 0) return null;
            return $"{minutes} min";
        }

        return new PointageDto
        {
            Id            = p.Id,
            Date          = p.Date.ToString("yyyy-MM-dd"),
            HeureEntree   = FormatHeure(p.HeureEntree),
            HeureSortie   = FormatHeure(p.HeureSortie),
            Duree         = FormatDuree(p.DureeMinutes),
            Retard        = FormatRetard(p.RetardMinutes),
            RetardMinutes = p.RetardMinutes,
            Statut        = p.Statut
        };
    }

    private static PointageDto EmptyToday() => new()
    {
        Date   = DateAujourdhui().ToString("yyyy-MM-dd"),
        Statut = "Absent"
    };
}
