using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace rh_management_backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialFullSetup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "TypeDuree",
                table: "DemandesConges",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "TypeConge",
                table: "DemandesConges",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Telephone",
                table: "DemandesConges",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SuperieurHierarchique",
                table: "DemandesConges",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Statut",
                table: "DemandesConges",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Service",
                table: "DemandesConges",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "NomComplet",
                table: "DemandesConges",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Matricule",
                table: "DemandesConges",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "GradeFonction",
                table: "DemandesConges",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Direction",
                table: "DemandesConges",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "DemandesConges",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TypeAutorisation",
                table: "DemandesAutorisations",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Telephone",
                table: "DemandesAutorisations",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Statut",
                table: "DemandesAutorisations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "NomComplet",
                table: "DemandesAutorisations",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Motif",
                table: "DemandesAutorisations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Matricule",
                table: "DemandesAutorisations",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "GradeFonction",
                table: "DemandesAutorisations",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Commentaire",
                table: "DemandesAutorisations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Direction",
                table: "DemandesAutorisations",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "DureeMinutes",
                table: "DemandesAutorisations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Service",
                table: "DemandesAutorisations",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SuperieurHierarchique",
                table: "DemandesAutorisations",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "DemandesAutorisations",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DemandesMaladie",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Matricule = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    NomComplet = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Direction = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Service = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    TypeMaladie = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    DateDebut = table.Column<DateOnly>(type: "date", nullable: false),
                    DateFin = table.Column<DateOnly>(type: "date", nullable: false),
                    NombreJours = table.Column<int>(type: "int", nullable: false),
                    ExempteAssiduité = table.Column<bool>(type: "bit", nullable: false),
                    CertificatMedicalFichierNom = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Commentaire = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Statut = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DemandesMaladie", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Employes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Matricule = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Nom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Prenom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Direction = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Service = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Fonction = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    SuperieurHierarchiqueMatricule = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    SoldeConges = table.Column<int>(type: "int", nullable: false),
                    AutorisationsUtiliseesMois = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HistoriqueActions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TypeDemande = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    DemandeId = table.Column<int>(type: "int", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    AuteurMatricule = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    AuteurRole = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Commentaire = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HistoriqueActions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Matricule = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EmployeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Employes_EmployeId",
                        column: x => x.EmployeId,
                        principalTable: "Employes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Employes",
                columns: new[] { "Id", "AutorisationsUtiliseesMois", "CreatedAt", "Direction", "Fonction", "IsActive", "Matricule", "Nom", "Prenom", "Service", "SoldeConges", "SuperieurHierarchiqueMatricule" },
                values: new object[,]
                {
                    { 1, 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Direction Finance", "Comptable", true, "EMP001", "Ben Ali", "Amine", "Comptabilité", 22, "SH001" },
                    { 2, 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Direction Finance", "Responsable Comptabilité", true, "SH001", "Chaabane", "Leila", "Comptabilité", 28, "DG001" },
                    { 3, 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Direction Générale", "Directeur Général", true, "DG001", "Mansouri", "Kamel", "Direction Générale", 30, null },
                    { 4, 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Direction Ressources Humaines", "Responsable RH", true, "RH001", "Trabelsi", "Sonia", "Ressources Humaines", 30, "DG001" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "EmployeId", "IsActive", "Matricule", "PasswordHash", "Role" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 1, true, "EMP001", "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lp02", "employe" },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2, true, "SH001", "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lp02", "n1" },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 3, true, "DG001", "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lp02", "dg" },
                    { 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 4, true, "RH001", "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lp02", "rh" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Employes_Matricule",
                table: "Employes",
                column: "Matricule",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_EmployeId",
                table: "Users",
                column: "EmployeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Matricule",
                table: "Users",
                column: "Matricule",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DemandesMaladie");

            migrationBuilder.DropTable(
                name: "HistoriqueActions");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Employes");

            migrationBuilder.DropColumn(
                name: "Direction",
                table: "DemandesConges");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "DemandesConges");

            migrationBuilder.DropColumn(
                name: "Commentaire",
                table: "DemandesAutorisations");

            migrationBuilder.DropColumn(
                name: "Direction",
                table: "DemandesAutorisations");

            migrationBuilder.DropColumn(
                name: "DureeMinutes",
                table: "DemandesAutorisations");

            migrationBuilder.DropColumn(
                name: "Service",
                table: "DemandesAutorisations");

            migrationBuilder.DropColumn(
                name: "SuperieurHierarchique",
                table: "DemandesAutorisations");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "DemandesAutorisations");

            migrationBuilder.AlterColumn<string>(
                name: "TypeDuree",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TypeConge",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Telephone",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SuperieurHierarchique",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "Statut",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Service",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<string>(
                name: "NomComplet",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "Matricule",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "GradeFonction",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<string>(
                name: "TypeAutorisation",
                table: "DemandesAutorisations",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(80)",
                oldMaxLength: 80);

            migrationBuilder.AlterColumn<string>(
                name: "Telephone",
                table: "DemandesAutorisations",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Statut",
                table: "DemandesAutorisations",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "NomComplet",
                table: "DemandesAutorisations",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "Motif",
                table: "DemandesAutorisations",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Matricule",
                table: "DemandesAutorisations",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "GradeFonction",
                table: "DemandesAutorisations",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150,
                oldNullable: true);
        }
    }
}
