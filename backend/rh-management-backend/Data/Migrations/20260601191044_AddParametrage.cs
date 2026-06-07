using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rh_management_backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddParametrage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Parametrages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CongesUniteJoursOuvres = table.Column<bool>(type: "bit", nullable: false),
                    CongesInclusionWeekend = table.Column<bool>(type: "bit", nullable: false),
                    CongesInclusionFeries = table.Column<bool>(type: "bit", nullable: false),
                    CongesDebitApresValidation = table.Column<bool>(type: "bit", nullable: false),
                    CongesSoldeMinimum = table.Column<int>(type: "int", nullable: false),
                    CongesDelaiDepot = table.Column<int>(type: "int", nullable: false),
                    CongesMotifObligatoire = table.Column<bool>(type: "bit", nullable: false),
                    AutoriMatinDebut = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AutoriMatinFin = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AutoriPauseDebut = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AutoriPauseFin = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AutoriApremDebut = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AutoriApremFin = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AutoriEteActif = table.Column<bool>(type: "bit", nullable: false),
                    AutoriEteDebut = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AutoriEteFin = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AutoriEteHeureDebut = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AutoriEteHeureFin = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AutoriRamadanActif = table.Column<bool>(type: "bit", nullable: false),
                    AutoriRamadanDebut = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AutoriRamadanFin = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AutoriDureeMaxPerso = table.Column<int>(type: "int", nullable: false),
                    AutoriBlocageAuto = table.Column<bool>(type: "bit", nullable: false),
                    MaladieCertificatObligatoire = table.Column<bool>(type: "bit", nullable: false),
                    MaladieValidationRhOnly = table.Column<bool>(type: "bit", nullable: false),
                    MaladieExclusionAssiduite = table.Column<bool>(type: "bit", nullable: false),
                    PersonnelFieldsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RolePermsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WorkflowStepsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MaladieTypesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AssiduiteBaremeJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NotificationsJson = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Parametrages", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Parametrages");
        }
    }
}
