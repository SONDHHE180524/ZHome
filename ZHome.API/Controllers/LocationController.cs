using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZHome.API.Data;

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class LocationController : ControllerBase
    {
        private readonly ZHomeDbContext _context;

        public LocationController(ZHomeDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetLocations([FromQuery] int level = 2)
        {
            var locations = await _context.Locations
                .Where(l => l.Level == level)
                .OrderBy(l => l.Type == "Quận" ? 0 : (l.Type == "Thị xã" ? 1 : 2))
                .ThenBy(l => l.Name)
                .ToListAsync();
            return Ok(locations);
        }

        [HttpGet("{parentId}/children")]
        public async Task<IActionResult> GetChildren(int parentId)
        {
            var children = await _context.Locations
                .Where(l => l.ParentId == parentId)
                .OrderBy(l => l.Type == "Phường" ? 0 : (l.Type == "Thị trấn" ? 1 : 2))
                .ThenBy(l => l.Name)
                .ToListAsync();
            return Ok(children);
        }

        [HttpGet("coverage")]
        public async Task<IActionResult> GetCoverage()
        {
            var districts = await _context.Locations
                .Where(l => l.Level == 2)
                .Select(d => new
                {
                    d.Id,
                    d.Name,
                    d.Type,
                    ChildrenCount = _context.Locations.Count(c => c.ParentId == d.Id)
                })
                .OrderBy(d => d.ChildrenCount)
                .ThenBy(d => d.Name)
                .ToListAsync();

            return Ok(districts);
        }
    }
}
