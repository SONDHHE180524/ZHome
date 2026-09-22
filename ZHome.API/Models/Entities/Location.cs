using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ZHome.API.Models.Entities
{
    [Table("locations")]
    public class Location
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("type")]
        public string Type { get; set; } = string.Empty;

        [Column("parent_id")]
        public int? ParentId { get; set; }

        [Column("level")]
        public int Level { get; set; }

        [ForeignKey("ParentId")]
        [JsonIgnore]
        public Location? Parent { get; set; }

        public ICollection<Location> Children { get; set; } = new List<Location>();
    }
}
