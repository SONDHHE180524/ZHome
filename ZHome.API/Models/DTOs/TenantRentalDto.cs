using System;
using System.Collections.Generic;

namespace ZHome.API.Models.DTOs
{
    public class TenantRentalDto
    {
        public long ContractId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal RoomPrice { get; set; } // Split room price for this tenant
        
        // Room Details
        public long RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public decimal OriginalRoomPrice { get; set; }
        public decimal Area { get; set; }
        public int MaxOccupants { get; set; }
        public string RoomStatus { get; set; } = string.Empty;
        public List<string> Amenities { get; set; } = new();

        // Property Details
        public long PropertyId { get; set; }
        public string PropertyTitle { get; set; } = string.Empty;
        public string PropertyAddress { get; set; } = string.Empty;
        public string PropertyDescription { get; set; } = string.Empty;
        public bool IsVerifiedTick { get; set; }

        // Landlord Details
        public string LandlordName { get; set; } = string.Empty;
        public string LandlordPhone { get; set; } = string.Empty;
        public string LandlordEmail { get; set; } = string.Empty;

        // Current Month / Latest Bill details
        public BillResponseDto? LatestBill { get; set; }
    }
}
