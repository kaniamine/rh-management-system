using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rh_management_backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class DemandeCongeDetail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EstBrouillon",
                table: "DemandesConges",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PieceJustificativeFichierNom",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Service",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SuperieurHierarchique",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TypeDuree",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EstBrouillon",
                table: "DemandesConges");

            migrationBuilder.DropColumn(
                name: "PieceJustificativeFichierNom",
                table: "DemandesConges");

            migrationBuilder.DropColumn(
                name: "Service",
                table: "DemandesConges");

            migrationBuilder.DropColumn(
                name: "SuperieurHierarchique",
                table: "DemandesConges");

            migrationBuilder.DropColumn(
                name: "TypeDuree",
                table: "DemandesConges");
        }
    }
}
