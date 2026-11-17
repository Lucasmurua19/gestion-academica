using CLASE_ORM.Application.DTO.Alumno;
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
    public class AlumnoController : ControllerBase
    {

        private readonly IAlumnoService _service;

        public AlumnoController(IAlumnoService service)
        {
            _service = service;
        }

        // GET api/Alumno?page=1&pageSize=10&search=ana  (las materias de un alumno se consultan en api/inscripciones?alumnoId=)
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] AlumnoQuery query)
        {

            var alumnos = await _service.GetPagedAsync(query);
            return Ok(alumnos);

        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {

            var alumno = await _service.GetByIdAsync(id);
            return Ok(alumno);

        }

        [HttpPost]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Create(CrearAlumnoDto dto)
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Update(int id, ActualizarAlumnoDto dto)
        {
            await _service.UpdateAsync(id, dto);
            return NoContent();
        }

        // 409 si el alumno tiene inscripciones (activas o de baja): el historial se conserva.
        [HttpDelete("{id:int}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }

    }
}
