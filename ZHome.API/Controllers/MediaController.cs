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
        public async Task<IActionResult> GetMedia(string folder, string fileName)
        {
            var etag = $"\"{fileName.GetHashCode():x}\"";
            if (Request.Headers.IfNoneMatch == etag)
            {
                return StatusCode(304);
            }

            var result = await _mediaStorage.GetImageAsync(folder, fileName);
            if (result == null)
            {
                return NotFound();
            }

            // Thiết lập cache 30 ngày trên browser, tải lại trang sẽ lấy trực tiếp từ memory/disk cache tức thì (0ms)
            Response.Headers["Cache-Control"] = "public, max-age=2592000, immutable";
            Response.Headers["ETag"] = etag;

            return File(result.Value.Data, result.Value.ContentType);
        }
    }
}
