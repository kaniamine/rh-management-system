using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rh_management_backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_EmployeId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Direction",
                table: "DemandesConges");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "DemandesConges");

            migrationBuilder.RenameColumn(
                name: "AutorisationsUtiliseesMois",
                table: "Employes",
                newName: "SoldeCongesJours");

            migrationBuilder.AlterColumn<string>(
                name: "SuperieurHierarchiqueMatricule",
                table: "Employes",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Service",
                table: "Employes",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<string>(
                name: "Prenom",
                table: "Employes",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Nom",
                table: "Employes",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Matricule",
                table: "Employes",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "Fonction",
                table: "Employes",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<string>(
                name: "Direction",
                table: "Employes",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150);

            migrationBuilder.AddColumn<string>(
                name: "NomComplet",
                table: "Employes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SuperieurHierarchique",
                table: "Employes",
                type: "nvarchar(max)",
                nullable: true);

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

            migrationBuilder.AddColumn<string>(
                name: "MotifRejet",
                table: "DemandesConges",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "NomComplet", "SoldeCongesJours", "SuperieurHierarchique" },
                values: new object[] { "", 30, null });

            migrationBuilder.UpdateData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "NomComplet", "SoldeCongesJours", "SuperieurHierarchique" },
                values: new object[] { "", 30, null });

            migrationBuilder.UpdateData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "NomComplet", "SoldeCongesJours", "SuperieurHierarchique" },
                values: new object[] { "", 30, null });

            migrationBuilder.UpdateData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "NomComplet", "SoldeCongesJours", "SuperieurHierarchique" },
                values: new object[] { "", 30, null });

            migrationBuilder.CreateIndex(
                name: "IX_Users_EmployeId",
                table: "Users",
                column: "EmployeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_EmployeId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "NomComplet",
                table: "Employes");

            migrationBuilder.DropColumn(
                name: "SuperieurHierarchique",
                table: "Employes");

            migrationBuilder.DropColumn(
                name: "MotifRejet",
                table: "DemandesConges");

            migrationBuilder.RenameColumn(
                name: "SoldeCongesJours",
                table: "Employes",
                newName: "AutorisationsUtiliseesMois");

            migrationBuilder.AlterColumn<string>(
                name: "SuperieurHierarchiqueMatricule",
                table: "Employes",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Service",
                table: "Employes",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Prenom",
                table: "Employes",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Nom",
                table: "Employes",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Matricule",
                table: "Employes",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Fonction",
                table: "Employes",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Direction",
                table: "Employes",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

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

            migrationBuilder.UpdateData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 1,
                column: "AutorisationsUtiliseesMois",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 2,
                column: "AutorisationsUtiliseesMois",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 3,
                column: "AutorisationsUtiliseesMois",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 4,
                column: "AutorisationsUtiliseesMois",
                value: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Users_EmployeId",
                table: "Users",
                column: "EmployeId",
                unique: true);
        }
    }
}
