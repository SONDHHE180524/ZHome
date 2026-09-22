namespace ZHome.API.Models
{
    public class PayOSSettings
    {
        public string ClientId { get; set; } = "YOUR_PAYOS_CLIENT_ID";
        public string ApiKey { get; set; } = "YOUR_PAYOS_API_KEY";
        public string ChecksumKey { get; set; } = "YOUR_PAYOS_CHECKSUM_KEY";
        public string ReturnUrl { get; set; } = "http://localhost:4200/landlord/packages?status=success";
        public string CancelUrl { get; set; } = "http://localhost:4200/landlord/packages?status=cancel";
        public string FallbackBankName { get; set; } = "MBBank";
        public string FallbackAccountNo { get; set; } = "0987654321";
        public string FallbackAccountName { get; set; } = "DANG HOANG SON";
    }
}
