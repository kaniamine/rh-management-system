using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rh_management_backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class DemandesAutorisations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DemandesAutorisations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NomComplet = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Matricule = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GradeFonction = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TypeAutorisation = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateDemande = table.Column<DateOnly>(type: "date", nullable: false),
                    HeureSortie = table.Column<TimeOnly>(type: "time", nullable: true),
                    HeureRetour = table.Column<TimeOnly>(type: "time", nullable: true),
                    Motif = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Destination = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Telephone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Statut = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DemandesAutorisations", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DemandesAutorisations");
        }
    }
}
