using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rh_management_backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class ResetSeedData : Migration
    {
        // BCrypt hash of "0000" — same as the seed hash in RhDbContext
        private const string Hash = "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lp02";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Reset test users: password back to "0000" and PremiereConnexion back to true
            foreach (var id in new[] { 1, 2, 3, 4 })
            {
                migrationBuilder.UpdateData(
                    table: "Users",
                    keyColumn: "Id",
                    keyValue: id,
                    columns: new[] { "PasswordHash", "PremiereConnexion" },
                    values: new object[] { Hash, true });
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Nothing to reverse — this is a dev-only seed reset
        }
    }
}
