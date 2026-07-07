using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZHome.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFavorites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "subscription_end_date",
                table: "users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "subscription_id",
                table: "users",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "favorites",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    room_id = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_favorites", x => x.id);
                    table.ForeignKey(
                        name: "FK_favorites_rooms_room_id",
                        column: x => x.room_id,
                        principalTable: "rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_favorites_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "subscription_packages",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    price = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false),
                    max_rooms = table.Column<int>(type: "int", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subscription_packages", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_users_subscription_id",
                table: "users",
                column: "subscription_id");

            migrationBuilder.CreateIndex(
                name: "IX_favorites_room_id",
                table: "favorites",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "IX_favorites_user_id",
                table: "favorites",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "FK_users_subscription_packages_subscription_id",
                table: "users",
                column: "subscription_id",
                principalTable: "subscription_packages",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_users_subscription_packages_subscription_id",
                table: "users");

            migrationBuilder.DropTable(
                name: "favorites");

            migrationBuilder.DropTable(
                name: "subscription_packages");

            migrationBuilder.DropIndex(
                name: "IX_users_subscription_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "subscription_end_date",
                table: "users");

            migrationBuilder.DropColumn(
                name: "subscription_id",
                table: "users");
        }
    }
}
