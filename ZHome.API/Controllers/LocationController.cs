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

        [HttpGet("districts")]
        public async Task<IActionResult> GetDistricts()
        {
            var districts = await _context.Districts
                .OrderBy(d => d.Id)
                .ToListAsync();
            return Ok(districts);
        }

        [HttpGet("districts/{districtId}/wards")]
        public async Task<IActionResult> GetWards(int districtId)
        {
            var wards = await _context.Wards
                .Where(w => w.DistrictId == districtId)
                .OrderBy(w => w.Id)
                .ToListAsync();
            return Ok(wards);
        }
    }
}
