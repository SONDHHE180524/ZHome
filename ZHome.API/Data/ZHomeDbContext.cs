using Microsoft.EntityFrameworkCore;
using ZHome.API.Models.Entities;

namespace ZHome.API.Data
{
    public class ZHomeDbContext : DbContext
    {
        public ZHomeDbContext(DbContextOptions<ZHomeDbContext> options) : base(options)
        {
        }

        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<SubscriptionPackage> SubscriptionPackages { get; set; }
        public DbSet<LandlordVerification> LandlordVerifications { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<RoomAmenity> RoomAmenities { get; set; }
        public DbSet<RoomImage> RoomImages { get; set; }
        public DbSet<MatchingProfile> MatchingProfiles { get; set; }
        public DbSet<Contract> Contracts { get; set; }
        public DbSet<MonthlyBill> MonthlyBills { get; set; }
        public DbSet<BillTransaction> BillTransactions { get; set; }
        public DbSet<TaxConfig> TaxConfigs { get; set; }
        public DbSet<ZHome.API.Models.Entities.ServiceProvider> ServiceProviders { get; set; }
        public DbSet<ServiceOrder> ServiceOrders { get; set; }
        public DbSet<District> Districts { get; set; }
        public DbSet<Ward> Wards { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<Favorite> Favorites { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Composite key for RoomAmenity
            modelBuilder.Entity<RoomAmenity>()
                .HasKey(ra => new { ra.RoomId, ra.AmenityName });

            modelBuilder.Entity<SubscriptionPackage>()
                .Property(sp => sp.Price)
                .HasPrecision(12, 2);

            // Configure decimal precisions
            modelBuilder.Entity<Property>()
                .Property(p => p.Latitude)
                .HasPrecision(10, 8);

            modelBuilder.Entity<Property>()
                .Property(p => p.Longitude)
                .HasPrecision(11, 8);

            modelBuilder.Entity<Room>()
                .Property(r => r.Price)
                .HasPrecision(12, 2);

            modelBuilder.Entity<Room>()
                .Property(r => r.Area)
                .HasPrecision(5, 2);

            modelBuilder.Entity<MatchingProfile>()
                .Property(mp => mp.BudgetMin)
                .HasPrecision(12, 2);

            modelBuilder.Entity<MatchingProfile>()
                .Property(mp => mp.BudgetMax)
                .HasPrecision(12, 2);

            modelBuilder.Entity<Contract>()
                .Property(c => c.RoomPrice)
                .HasPrecision(12, 2);

            modelBuilder.Entity<MonthlyBill>()
                .Property(mb => mb.RoomFee)
                .HasPrecision(12, 2);

            modelBuilder.Entity<MonthlyBill>()
                .Property(mb => mb.ElectricityOldReading)
                .HasPrecision(10, 2);

            modelBuilder.Entity<MonthlyBill>()
                .Property(mb => mb.ElectricityNewReading)
                .HasPrecision(10, 2);

            modelBuilder.Entity<MonthlyBill>()
                .Property(mb => mb.ElectricityFee)
                .HasPrecision(12, 2);

            modelBuilder.Entity<MonthlyBill>()
                .Property(mb => mb.WaterOldReading)
                .HasPrecision(10, 2);

            modelBuilder.Entity<MonthlyBill>()
                .Property(mb => mb.WaterNewReading)
                .HasPrecision(10, 2);

            modelBuilder.Entity<MonthlyBill>()
                .Property(mb => mb.WaterFee)
                .HasPrecision(12, 2);

            modelBuilder.Entity<MonthlyBill>()
                .Property(mb => mb.ServiceFee)
                .HasPrecision(12, 2);

            modelBuilder.Entity<MonthlyBill>()
                .Property(mb => mb.RepairDeduction)
                .HasPrecision(12, 2);

            modelBuilder.Entity<MonthlyBill>()
                .Property(mb => mb.TotalAmount)
                .HasPrecision(12, 2);

            modelBuilder.Entity<TaxConfig>()
                .Property(tc => tc.RevenueThreshold)
                .HasPrecision(12, 2);

            modelBuilder.Entity<TaxConfig>()
                .Property(tc => tc.VatRate)
                .HasPrecision(5, 4);

            modelBuilder.Entity<TaxConfig>()
                .Property(tc => tc.PitRate)
                .HasPrecision(5, 4);

            modelBuilder.Entity<ZHome.API.Models.Entities.ServiceProvider>()
                .Property(sp => sp.Rating)
                .HasPrecision(3, 2);

            modelBuilder.Entity<ServiceOrder>()
                .Property(so => so.TotalPrice)
                .HasPrecision(12, 2);

            modelBuilder.Entity<ServiceOrder>()
                .Property(so => so.CommissionAmount)
                .HasPrecision(12, 2);

            modelBuilder.Entity<MonthlyBill>()
                .HasOne(m => m.Room)
                .WithMany(r => r.MonthlyBills)
                .HasForeignKey(m => m.RoomId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BillTransaction>()
                .HasOne(b => b.MonthlyBill)
                .WithMany(m => m.Transactions)
                .HasForeignKey(b => b.MonthlyBillId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
