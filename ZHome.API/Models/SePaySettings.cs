namespace ZHome.API.Models
{
    public class SePaySettings
    {
        public string ApiKey { get; set; } = "YOUR_SEPAY_API_KEY";
        public string BankCode { get; set; } = "MBBank";
        public string AccountNumber { get; set; } = "0987654321";
        public string AccountName { get; set; } = "DANG HOANG SON";
        public string QrTemplate { get; set; } = "compact2";
    }
}
