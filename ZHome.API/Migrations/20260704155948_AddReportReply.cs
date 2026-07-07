using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZHome.API.Migrations
{
    /// <inheritdoc />
    public partial class AddReportReply : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "landlord_reply",
                table: "reports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "replied_at",
                table: "reports",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "landlord_reply",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "replied_at",
                table: "reports");
        }
    }
}
