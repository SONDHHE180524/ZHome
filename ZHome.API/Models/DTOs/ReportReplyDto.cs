using System.ComponentModel.DataAnnotations;

namespace ZHome.API.Models.DTOs
{
    public class ReportReplyDto
    {
        [Required]
        public string ReplyContent { get; set; } = string.Empty;
    }
}
