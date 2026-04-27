using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rh_management_backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // PremiereConnexion already added by AddPremiereConnexion migration
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'Users'
                    AND COLUMN_NAME = 'NombreConnexions'
                )
                BEGIN
                    ALTER TABLE [Users]
                    ADD [NombreConnexions] int NOT NULL DEFAULT 0;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NombreConnexions",
                table: "Users");
        }
    }
}
