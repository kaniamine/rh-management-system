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
            // Telephone column already exists in DB — skip AddColumn to avoid duplicate column error.
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
            // Nothing to revert — AddColumn was skipped because the column pre-existed.
        }
    }
}
