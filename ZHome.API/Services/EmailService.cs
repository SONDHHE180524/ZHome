using System;
using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ZHome.API.Services
{
    public interface IEmailService
    {
        bool SendEmail(string toEmail, string subject, string bodyHtml, out string details);
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
            var senderEmail = _configuration["EmailSettings:SenderEmail"] ?? "danghoangson2752k4@gmail.com";
            var senderName = _configuration["EmailSettings:SenderName"] ?? "ZHome Boarding Management";
            var smtpServer = _configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
            var portStr = _configuration["EmailSettings:Port"] ?? "587";
            var username = _configuration["EmailSettings:Username"] ?? "danghoangson2752k4@gmail.com";
            var password = _configuration["EmailSettings:Password"] ?? "";

            int.TryParse(portStr, out int port);
            if (port <= 0) port = 587;

            try
            {
                if (string.IsNullOrWhiteSpace(password))
                {
                    _logger.LogWarning($"Simulated Email sending from {senderEmail} to {toEmail} (Password not configured). Subject: {subject}");
                    details = "Lưu thành công vào log hệ thống (Simulated - SMTP password is blank)";
                    return true; 
                }

                Task.Run(() => 
                {
                    try
                    {
                        using (var mail = new MailMessage())
                        {
                            mail.From = new MailAddress(senderEmail, senderName);
                            mail.To.Add(new MailAddress(toEmail));
                            mail.Subject = subject;
                            mail.Body = bodyHtml;
                            mail.IsBodyHtml = true;
                            
                            // Thêm các header để hạn chế bị đánh dấu Spam
                            mail.Headers.Add("Message-Id", $"<{Guid.NewGuid()}@zhome.local>");
                            mail.Headers.Add("Reply-To", senderEmail);
                            mail.Priority = MailPriority.Normal;

                            using (var smtp = new SmtpClient(smtpServer, port))
                            {
                                smtp.Credentials = new NetworkCredential(username, password);
                                smtp.EnableSsl = true;
                                smtp.Send(mail);
                            }
                        }
                        _logger.LogInformation($"Successfully sent email from {senderEmail} to {toEmail}. Subject: {subject}");
                    }
                    catch (Exception e)
                    {
                        _logger.LogError(e, $"Failed to send email to {toEmail} in background task.");
                    }
                });

                details = "Đã đưa vào hàng đợi gửi email (SMTP Background Task)!";
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send email to {toEmail} via SMTP Server: {smtpServer}. Falling back to simulated log.");
                details = $"Lỗi SMTP: {ex.Message} (Đã tự động sao lưu log hệ thống)";
                return false;
            }
        }
    }
}
