namespace rh_management_backend.DTOs.Pointage;

public class PointageDto
{
    public int?    Id            { get; set; }
    public string  Date          { get; set; } = string.Empty;
    public string? HeureEntree   { get; set; }
    public string? HeureSortie   { get; set; }
    public string? Duree         { get; set; }
    public string? Retard        { get; set; }
    public int?    RetardMinutes { get; set; }
    public string  Statut        { get; set; } = "Absent";
}
