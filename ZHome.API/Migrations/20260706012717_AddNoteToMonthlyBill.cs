using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZHome.API.Migrations
{
    /// <inheritdoc />
    public partial class AddNoteToMonthlyBill : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_monthly_bills_rooms_room_id",
                table: "monthly_bills");

            migrationBuilder.AddColumn<string>(
                name: "note",
                table: "monthly_bills",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_monthly_bills_rooms_room_id",
                table: "monthly_bills",
                column: "room_id",
                principalTable: "rooms",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_monthly_bills_rooms_room_id",
                table: "monthly_bills");

            migrationBuilder.DropColumn(
                name: "note",
                table: "monthly_bills");

            migrationBuilder.AddForeignKey(
                name: "FK_monthly_bills_rooms_room_id",
                table: "monthly_bills",
                column: "room_id",
                principalTable: "rooms",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
