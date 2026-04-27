using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rh_management_backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class EnrichNotification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Action",
                table: "Notifications",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DemandeId",
                table: "Notifications",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DestinataireRole",
                table: "Notifications",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TypeDemande",
                table: "Notifications",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Action",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "DemandeId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "DestinataireRole",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "TypeDemande",
                table: "Notifications");
        }
    }
}
