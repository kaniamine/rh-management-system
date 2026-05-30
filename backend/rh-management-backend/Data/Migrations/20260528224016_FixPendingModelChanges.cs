using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rh_management_backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixPendingModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add Telephone column if it doesn't already exist (handles both fresh and existing DBs).
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'Employes' AND COLUMN_NAME = 'Telephone'
                )
                BEGIN
                    ALTER TABLE [Employes] ADD [Telephone] nvarchar(max) NULL
                END
            ");

            migrationBuilder.UpdateData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 1,
                column: "Telephone",
                value: null);

            migrationBuilder.UpdateData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 2,
                column: "Telephone",
                value: null);

            migrationBuilder.UpdateData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 3,
                column: "Telephone",
                value: null);

            migrationBuilder.UpdateData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 4,
                column: "Telephone",
                value: null);

            migrationBuilder.UpdateData(
                table: "Employes",
                keyColumn: "Id",
                keyValue: 5,
                column: "Telephone",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Telephone",
                table: "Employes");
        }
    }
}
