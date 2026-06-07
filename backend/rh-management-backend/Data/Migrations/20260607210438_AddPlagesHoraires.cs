using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rh_management_backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPlagesHoraires : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HoraireApresMidiDebut",
                table: "Parametrages",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HoraireApresMidiFin",
                table: "Parametrages",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "HoraireEteActif",
                table: "Parametrages",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "HoraireEtePeriodeDebut",
                table: "Parametrages",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HoraireEtePeriodeFin",
                table: "Parametrages",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HoraireEtePlageDebut",
                table: "Parametrages",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HoraireEtePlageFin",
                table: "Parametrages",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HoraireMatinDebut",
                table: "Parametrages",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HoraireMatinFin",
                table: "Parametrages",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HorairePauseDebut",
                table: "Parametrages",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HorairePauseFin",
                table: "Parametrages",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "HoraireRamadanActif",
                table: "Parametrages",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HoraireApresMidiDebut",
                table: "Parametrages");

            migrationBuilder.DropColumn(
                name: "HoraireApresMidiFin",
                table: "Parametrages");

            migrationBuilder.DropColumn(
                name: "HoraireEteActif",
                table: "Parametrages");

            migrationBuilder.DropColumn(
                name: "HoraireEtePeriodeDebut",
                table: "Parametrages");

            migrationBuilder.DropColumn(
                name: "HoraireEtePeriodeFin",
                table: "Parametrages");

            migrationBuilder.DropColumn(
                name: "HoraireEtePlageDebut",
                table: "Parametrages");

            migrationBuilder.DropColumn(
                name: "HoraireEtePlageFin",
                table: "Parametrages");

            migrationBuilder.DropColumn(
                name: "HoraireMatinDebut",
                table: "Parametrages");

            migrationBuilder.DropColumn(
                name: "HoraireMatinFin",
                table: "Parametrages");

            migrationBuilder.DropColumn(
                name: "HorairePauseDebut",
                table: "Parametrages");

            migrationBuilder.DropColumn(
                name: "HorairePauseFin",
                table: "Parametrages");

            migrationBuilder.DropColumn(
                name: "HoraireRamadanActif",
                table: "Parametrages");
        }
    }
}
