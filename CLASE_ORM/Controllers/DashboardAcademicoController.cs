using CLASE_ORM.Application.DTO.Dashboard;
using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CLASE_ORM.Controllers
{
    [Route("api/dashboard-academico")]
    [ApiController]
    [Authorize(Roles = Roles.AdminOConsulta)]
    public class DashboardAcademicoController : ControllerBase
    {
        private readonly IDashboardService _service;

        public DashboardAcademicoController(IDashboardService service)
        {
            _service = service;
        }

        // GET api/dashboard-academico?materiaId=2  (materiaId es opcional; 404 si la materia no existe)
        [HttpGet]
        public async Task<IActionResult> GetResumen([FromQuery] ResumenAcademicoQuery query)
        {
            var resumen = await _service.ObtenerResumenAsync(query);
            return Ok(resumen);
        }
    }
}
