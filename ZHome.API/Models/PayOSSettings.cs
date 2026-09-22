namespace ZHome.API.Models
{
    public class PayOSSettings
    {
        public string ClientId { get; set; } = "YOUR_PAYOS_CLIENT_ID";
        public string ApiKey { get; set; } = "YOUR_PAYOS_API_KEY";
        public string ChecksumKey { get; set; } = "YOUR_PAYOS_CHECKSUM_KEY";
        public string ReturnUrl { get; set; } = "https://zhome-fe.onrender.com/landlord/packages?status=success";
        public string CancelUrl { get; set; } = "https://zhome-fe.onrender.com/landlord/packages?status=cancel";
        public string FallbackBankName { get; set; } = "VietinBank";
        public string FallbackAccountNo { get; set; } = "888819661666";
        public string FallbackAccountName { get; set; } = "NGUYEN THANH TUNG";
    }
}
