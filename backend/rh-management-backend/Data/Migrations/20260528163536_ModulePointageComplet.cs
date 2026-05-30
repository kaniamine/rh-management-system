using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rh_management_backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class ModulePointageComplet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Pointages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HeureEntree = table.Column<DateTime>(type: "datetime2", nullable: true),
                    HeureSortie = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DernierHeartbeat = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DureeMinutes = table.Column<int>(type: "int", nullable: true),
                    RetardMinutes = table.Column<int>(type: "int", nullable: true),
                    Statut = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pointages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pointages_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Pointages_UserId",
                table: "Pointages",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Pointages");
        }
    }
}
