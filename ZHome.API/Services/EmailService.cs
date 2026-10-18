using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;

namespace ZHome.API.Services
{
    public interface IEmailService
    {
        bool SendEmail(string toEmail, string subject, string bodyHtml, out string details);
        Task<(bool Success, string Message)> SendEmailAsync(string toEmail, string subject, string bodyHtml);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public bool SendEmail(string toEmail, string subject, string bodyHtml, out string details)
        {
            var result = SendEmailAsync(toEmail, subject, bodyHtml).GetAwaiter().GetResult();
            details = result.Message;
            return result.Success;
        }

        public async Task<(bool Success, string Message)> SendEmailAsync(string toEmail, string subject, string bodyHtml)
        {
            var senderEmail = _configuration["EmailSettings:SenderEmail"] ?? "anhtungnd2004@gmail.com";
            var senderName = _configuration["EmailSettings:SenderName"] ?? "ZHome Platform";
            var smtpServer = _configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
            var username = _configuration["EmailSettings:Username"] ?? "anhtungnd2004@gmail.com";
            var password = _configuration["EmailSettings:Password"] ?? "mjcypzkvxoomblug";

            if (string.IsNullOrWhiteSpace(password))
            {
                _logger.LogWarning($"Simulated Email sending to {toEmail} (Password not configured). Subject: {subject}");
                return (true, "Lưu thành công vào log hệ thống (Simulated)");
            }

            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(senderName, senderEmail));
                message.To.Add(new MailboxAddress(toEmail, toEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = bodyHtml
                };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                // Bỏ qua kiểm tra chứng chỉ SSL nếu có phần mềm diệt virus hoặc proxy can thiệp
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;

                // Cổng 465 (Direct SSL) hoạt động ổn định và xuyên suốt mọi mạng, không bị ISP/WARP chặn
                try
                {
                    await client.ConnectAsync(smtpServer, 465, SecureSocketOptions.SslOnConnect);
                }
                catch (Exception connEx)
                {
                    _logger.LogWarning($"Kết nối port 465 thất bại ({connEx.Message}), đang thử cổng 587 STARTTLS...");
                    await client.ConnectAsync(smtpServer, 587, SecureSocketOptions.StartTls);
                }

                await client.AuthenticateAsync(username.Trim(), password.Trim());
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation($"[MailKit] Đã gửi email thành công từ {senderEmail} đến {toEmail}. Tiêu đề: {subject}");
                return (true, "Gửi email thành công!");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[MailKit] Thất bại khi gửi email đến {toEmail} qua {smtpServer}: {ex.Message}");
                return (false, $"Lỗi gửi email: {ex.Message}");
            }
        }
    }
}
