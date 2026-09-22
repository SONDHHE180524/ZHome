namespace ZHome.API.Models
{
    public class SePaySettings
    {
        public string ApiKey { get; set; } = "YOUR_SEPAY_API_KEY";
        public string BankCode { get; set; } = "VietinBank";
        public string AccountNumber { get; set; } = "888819661666";
        public string AccountName { get; set; } = "NGUYEN THANH TUNG";
        public string QrTemplate { get; set; } = "compact2";
    }
}
