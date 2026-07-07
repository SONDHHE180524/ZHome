using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("landlord_verifications")]
    public class LandlordVerification
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("user_id")]
        public long UserId { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("id_card_number")]
        public string IdCardNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("id_card_front_url")]
        public string IdCardFrontUrl { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("id_card_back_url")]
        public string IdCardBackUrl { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("ownership_document_url")]
        public string OwnershipDocumentUrl { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("status")]
        public string Status { get; set; } = "Pending";

        [Column("verified_at")]
        public DateTime? VerifiedAt { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
