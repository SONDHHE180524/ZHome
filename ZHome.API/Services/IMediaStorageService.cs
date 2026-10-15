using System.Threading.Tasks;

namespace ZHome.API.Services
{
    public interface IMediaStorageService
    {
        Task<string> SaveBase64ImageAsync(string base64String, string folder, string prefix, string identifier = "");
        Task<(byte[] Data, string ContentType)?> GetImageAsync(string folder, string fileName);
        Task SyncLocalDiskToDbAsync();
    }
}
