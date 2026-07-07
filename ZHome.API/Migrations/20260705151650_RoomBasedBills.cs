using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZHome.API.Migrations
{
    /// <inheritdoc />
    public partial class RoomBasedBills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_monthly_bills_contracts_contract_id",
                table: "monthly_bills");

            migrationBuilder.RenameColumn(
                name: "contract_id",
                table: "monthly_bills",
                newName: "room_id");

            migrationBuilder.RenameIndex(
                name: "IX_monthly_bills_contract_id",
                table: "monthly_bills",
                newName: "IX_monthly_bills_room_id");

            migrationBuilder.AddColumn<decimal>(
                name: "paid_amount",
                table: "monthly_bills",
                type: "DECIMAL(12,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "bill_transactions",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    monthly_bill_id = table.Column<long>(type: "bigint", nullable: false),
                    tenant_id = table.Column<long>(type: "bigint", nullable: false),
                    amount = table.Column<decimal>(type: "DECIMAL(12,2)", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    note = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bill_transactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_bill_transactions_monthly_bills_monthly_bill_id",
                        column: x => x.monthly_bill_id,
                        principalTable: "monthly_bills",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_bill_transactions_users_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_bill_transactions_monthly_bill_id",
                table: "bill_transactions",
                column: "monthly_bill_id");

            migrationBuilder.CreateIndex(
                name: "IX_bill_transactions_tenant_id",
                table: "bill_transactions",
                column: "tenant_id");

            migrationBuilder.AddForeignKey(
                name: "FK_monthly_bills_rooms_room_id",
                table: "monthly_bills",
                column: "room_id",
                principalTable: "rooms",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_monthly_bills_rooms_room_id",
                table: "monthly_bills");

            migrationBuilder.DropTable(
                name: "bill_transactions");

            migrationBuilder.DropColumn(
                name: "paid_amount",
                table: "monthly_bills");

            migrationBuilder.RenameColumn(
                name: "room_id",
                table: "monthly_bills",
                newName: "contract_id");

            migrationBuilder.RenameIndex(
                name: "IX_monthly_bills_room_id",
                table: "monthly_bills",
                newName: "IX_monthly_bills_contract_id");

            migrationBuilder.AddForeignKey(
                name: "FK_monthly_bills_contracts_contract_id",
                table: "monthly_bills",
                column: "contract_id",
                principalTable: "contracts",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
