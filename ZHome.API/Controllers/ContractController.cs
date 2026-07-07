using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZHome.API.Data;
using ZHome.API.Models.DTOs;
using ZHome.API.Models.DTOs;
using ZHome.API.Models.Entities;
using ZHome.API.Filters;

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ContractController : ControllerBase
    {
        private readonly ZHomeDbContext _context;

        public ContractController(ZHomeDbContext context)
        {
            _context = context;
        }

        // Tenant Check-in
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInRequestDto request)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            // Verify room exists and belongs to the landlord
            var room = await _context.Rooms
                .Include(r => r.Property)
                .FirstOrDefaultAsync(r => r.Id == request.RoomId && r.Property!.LandlordId == landlordId);

            if (room == null)
            {
                return NotFound("Không tìm thấy phòng trọ hoặc bạn không có quyền.");
            }

            if (room.Status == "Maintenance")
            {
                return BadRequest("Phòng này hiện tại đang được bảo trì.");
            }

            // Count active contracts for this room
            var activeContractsCount = await _context.Contracts
                .CountAsync(c => c.RoomId == request.RoomId && c.Status == "Active");

            if (activeContractsCount >= room.MaxOccupants)
            {
                return BadRequest($"Phòng này đã đạt số lượng người thuê tối đa ({room.MaxOccupants} người).");
            }

            // Check if tenant user already exists by phone
            var tenantUser = await _context.Users.FirstOrDefaultAsync(u => u.Phone == request.TenantPhone);

            if (tenantUser == null)
            {
                // Create a new Tenant user automatically
                var tenantRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Tenant");
                if (tenantRole == null)
                {
                    return BadRequest("Không tìm thấy vai trò Tenant trong cơ sở dữ liệu.");
                }

                tenantUser = new User
                {
                    Phone = request.TenantPhone,
                    FullName = request.TenantFullName,
                    RoleId = tenantRole.Id,
                    CccdNumber = request.TenantIdCardNumber,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), // Default password for automatically created tenant
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(tenantUser);
                await _context.SaveChangesAsync();
            }

            // Verify if this tenant already has an active contract for another room (optional rule, let's keep it simple)

            // Create Contract
            var contract = new Contract
            {
                RoomId = request.RoomId,
                TenantId = tenantUser.Id,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                RoomPrice = request.RoomPrice,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _context.Contracts.Add(contract);

            // Update room price and status
            room.Price = request.RoomPrice;
            room.Status = "Rented";

            await _context.SaveChangesAsync();


            // Load response DTO
            var response = new ContractResponseDto
            {
                Id = contract.Id,
                RoomId = contract.RoomId,
                RoomNumber = room.RoomNumber,
                PropertyTitle = room.Property?.Title ?? string.Empty,
                TenantId = tenantUser.Id,
                TenantFullName = tenantUser.FullName,
                TenantPhone = tenantUser.Phone,
                StartDate = contract.StartDate,
                EndDate = contract.EndDate,
                RoomPrice = contract.RoomPrice,
                Status = contract.Status
            };

            return Ok(response);
        }

        // Tenant Check-out / Terminate Contract
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpPost("{contractId}/check-out")]
        public async Task<IActionResult> CheckOut(long contractId)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var contract = await _context.Contracts
                .Include(c => c.Room)
                    .ThenInclude(r => r!.Property)
                .FirstOrDefaultAsync(c => c.Id == contractId && c.Room!.Property!.LandlordId == landlordId);

            if (contract == null)
            {
                return NotFound("Không tìm thấy hợp đồng hoặc bạn không sở hữu phòng trọ này.");
            }

            if (contract.Status != "Active")
            {
                return BadRequest("Hợp đồng này đã kết thúc trước đó.");
            }

            // Update contract status
            contract.Status = "Terminated";
            await _context.SaveChangesAsync();

            var roomId = contract.RoomId;
            var room = await _context.Rooms.FindAsync(roomId);

            var remainingContracts = await _context.Contracts
                .Where(c => c.RoomId == roomId && c.Status == "Active")
                .ToListAsync();

            if (remainingContracts.Count > 0 && room != null)
            {
                // Just keep them as is
            }
            else if (contract.Room != null)
            {
                // Reset room status to Available if no tenants remain
                contract.Room.Status = "Available";
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Làm thủ tục trả phòng thành công!" });
        }

        // Get active contracts for landlord properties
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpGet]
        public async Task<IActionResult> GetContracts()
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var contracts = await _context.Contracts
                .Include(c => c.Room)
                    .ThenInclude(r => r!.Property)
                .Include(c => c.Tenant)
                .Where(c => c.Room!.Property!.LandlordId == landlordId)
                .ToListAsync();

            var response = contracts.Select(c => new ContractResponseDto
            {
                Id = c.Id,
                RoomId = c.RoomId,
                RoomNumber = c.Room?.RoomNumber ?? string.Empty,
                PropertyTitle = c.Room?.Property?.Title ?? string.Empty,
                TenantId = c.TenantId,
                TenantFullName = c.Tenant?.FullName ?? string.Empty,
                TenantPhone = c.Tenant?.Phone ?? string.Empty,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                RoomPrice = c.RoomPrice,
                Status = c.Status
            }).ToList();

            return Ok(response);
        }

        // Get tenant by phone number (for auto-filling Check-In modal)
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpGet("tenant-by-phone/{phone}")]
        public async Task<IActionResult> GetTenantByPhone(string phone)
        {
            var tenantRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Tenant");
            if (tenantRole == null)
            {
                return BadRequest("Không tìm thấy vai trò Tenant.");
            }

            var tenant = await _context.Users
                .FirstOrDefaultAsync(u => u.Phone == phone && u.RoleId == tenantRole.Id);

            if (tenant == null)
            {
                return NotFound("Không tìm thấy khách thuê với số điện thoại này.");
            }

            return Ok(new
            {
                fullName = tenant.FullName,
                cccdNumber = tenant.CccdNumber
            });
        }

        // Get all active rentals for logged-in tenant (List for selection)
        [Authorize(Roles = "Tenant")]
        [HttpGet("my-rentals")]
        public async Task<IActionResult> GetMyRentals()
        {
            var tenantIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(tenantIdStr, out long tenantId))
            {
                return Unauthorized();
            }

            var contracts = await _context.Contracts
                .Include(c => c.Room)
                    .ThenInclude(r => r!.Property)
                .Where(c => c.TenantId == tenantId && c.Status == "Active")
                .Select(c => new
                {
                    ContractId = c.Id,
                    RoomNumber = c.Room!.RoomNumber,
                    PropertyTitle = c.Room.Property!.Title,
                    PropertyAddress = c.Room.Property.Address,
                    RoomPrice = c.RoomPrice,
                    StartDate = c.StartDate,
                    IsVerifiedTick = c.Room.Property.IsVerifiedTick
                })
                .ToListAsync();

            return Ok(contracts);
        }

        // Get active rental details for logged-in tenant
        [Authorize(Roles = "Tenant")]
        [HttpGet("my-rental")]
        public async Task<IActionResult> GetMyRental([FromQuery] long? contractId)
        {
            var tenantIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(tenantIdStr, out long tenantId))
            {
                return Unauthorized();
            }

            var query = _context.Contracts
                .Include(c => c.Room)
                    .ThenInclude(r => r!.Property)
                        .ThenInclude(p => p!.Landlord)
                .Include(c => c.Room)
                    .ThenInclude(r => r!.Amenities)
                .Where(c => c.TenantId == tenantId && c.Status == "Active");

            if (contractId.HasValue)
            {
                query = query.Where(c => c.Id == contractId.Value);
            }

            var contract = await query.FirstOrDefaultAsync();

            if (contract == null)
            {
                return NotFound("Bạn hiện tại không có hợp đồng thuê trọ nào đang hoạt động.");
            }

            // Find the latest monthly bill for this contract
            var latestBill = await _context.MonthlyBills
                .Where(b => b.RoomId == contract.RoomId)
                .OrderByDescending(b => b.BillingYear)
                .ThenByDescending(b => b.BillingMonth)
                .FirstOrDefaultAsync();

            var latestBillDto = latestBill != null ? new BillResponseDto
            {
                Id = latestBill.Id,
                RoomId = latestBill.RoomId,
                TenantName = contract.Tenant?.FullName ?? "Khách thuê ẩn danh",
                TenantPhone = contract.Tenant?.Phone ?? string.Empty,
                RoomNumber = contract.Room?.RoomNumber ?? string.Empty,
                PropertyTitle = contract.Room?.Property?.Title ?? string.Empty,
                BillingMonth = latestBill.BillingMonth,
                BillingYear = latestBill.BillingYear,
                RoomFee = latestBill.RoomFee,
                ElectricityOldReading = latestBill.ElectricityOldReading,
                ElectricityNewReading = latestBill.ElectricityNewReading,
                ElectricityFee = latestBill.ElectricityFee,
                WaterOldReading = latestBill.WaterOldReading,
                WaterNewReading = latestBill.WaterNewReading,
                WaterFee = latestBill.WaterFee,
                ServiceFee = latestBill.ServiceFee,
                RepairDeduction = latestBill.RepairDeduction,
                TotalAmount = latestBill.TotalAmount,
                Status = latestBill.Status,
                PaidAt = latestBill.PaidAt
            } : null;

            var response = new TenantRentalDto
            {
                ContractId = contract.Id,
                StartDate = contract.StartDate,
                EndDate = contract.EndDate,
                RoomPrice = contract.RoomPrice,
                RoomId = contract.RoomId,
                RoomNumber = contract.Room?.RoomNumber ?? string.Empty,
                OriginalRoomPrice = contract.Room?.Price ?? 0,
                Area = contract.Room?.Area ?? 0,
                MaxOccupants = contract.Room?.MaxOccupants ?? 1,
                RoomStatus = contract.Room?.Status ?? string.Empty,
                Amenities = contract.Room?.Amenities?.Select(a => a.AmenityName).ToList() ?? new List<string>(),
                PropertyId = contract.Room?.PropertyId ?? 0,
                PropertyTitle = contract.Room?.Property?.Title ?? string.Empty,
                PropertyAddress = contract.Room?.Property?.Address ?? string.Empty,
                PropertyDescription = contract.Room?.Property?.Description ?? string.Empty,
                IsVerifiedTick = contract.Room?.Property?.IsVerifiedTick ?? false,
                LandlordName = contract.Room?.Property?.Landlord?.FullName ?? string.Empty,
                LandlordPhone = contract.Room?.Property?.Landlord?.Phone ?? string.Empty,
                LandlordEmail = contract.Room?.Property?.Landlord?.Email ?? string.Empty,
                LatestBill = latestBillDto
            };

            return Ok(response);
        }
    }
}
