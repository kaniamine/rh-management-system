using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rh_management_backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddNombreConnexionsAndUser5 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NombreConnexions already added by UpdateSchema migration

            migrationBuilder.InsertData(
                table: "Employes",
                columns: new[] { "Id", "CreatedAt", "Direction", "Fonction", "IsActive", "Matricule", "Nom", "NomComplet", "Prenom", "Service", "SoldeConges", "SoldeCongesJours", "SuperieurHierarchiqueMatricule" },
                values: new object[] { 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Direction Informatique", "Développeur", true, "EMP002", "Bouazizi", "", "Amine", "Développement", 30, 30, "SH001" });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "EmployeId", "IsActive", "Matricule", "MustChangePassword", "NombreConnexions", "PasswordHash", "PremiereConnexion", "Role" },
                values: new object[] { 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 5, true, "EMP002", true, 0, "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lp02", true, "employe" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 5);
        }
    }
}
