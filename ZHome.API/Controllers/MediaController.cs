using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZHome.API.Services;

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("media")]
    [AllowAnonymous]
    public class MediaController : ControllerBase
    {
        private readonly IMediaStorageService _mediaStorage;

        public MediaController(IMediaStorageService mediaStorage)
        {
            _mediaStorage = mediaStorage;
        }

        [HttpGet("{folder}/{fileName}")]
        [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Any)]
        public async Task<IActionResult> GetMedia(string folder, string fileName)
        {
            var result = await _mediaStorage.GetImageAsync(folder, fileName);
            if (result == null)
            {
                return NotFound();
            }

            return File(result.Value.Data, result.Value.ContentType);
        }
    }
}
