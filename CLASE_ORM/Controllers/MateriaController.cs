using CLASE_ORM.Application.DTO.Materia;
using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CLASE_ORM.Controllers
{
    // Leer: Admin o Consulta. Crear / modificar / eliminar: solo Admin.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = Roles.AdminOConsulta)]
    public class MateriaController : ControllerBase
    {
        private readonly IMateriaService _service;

        public MateriaController(IMateriaService service)
        {

            _service = service;

        }

        // GET api/Materia?page=1&pageSize=10&search=mate
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] MateriaQuery query)
        {

            var materias = await _service.GetPagedAsync(query);
            return Ok(materias);

        }

        // GET api/Materia/todas -> sin paginar, para llenar desplegables (ej: la materia de un alumno).
        [HttpGet("todas")]
        public async Task<IActionResult> GetTodas()
        {

            var materias = await _service.GetAllAsync();
            return Ok(materias);

        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {

            var materia = await _service.GetByIdAsync(id);
            return Ok(materia);

        }

        [HttpPost]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Create(CrearMateriaDto dto)
        {

            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);

        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Update(int id, CrearMateriaDto materia)
        {

            await _service.UpdateAsync(id, materia);
            return NoContent();

        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Delete(int id)
        {

            await _service.DeleteAsync(id);
            return NoContent();

        }
    }
}
