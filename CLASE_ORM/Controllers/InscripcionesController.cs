using CLASE_ORM.Application.DTO.Inscripcion;
using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CLASE_ORM.Controllers
{
    // Leer: Admin o Consulta. Inscribir y dar de baja: solo Admin.
    [Route("api/inscripciones")]
    [ApiController]
    [Authorize(Roles = Roles.AdminOConsulta)]
    public class InscripcionesController : ControllerBase
    {
        private readonly IInscripcionService _service;

        public InscripcionesController(IInscripcionService service)
        {
            _service = service;
        }

        // GET api/inscripciones?page=1&pageSize=10&alumnoId=3&materiaId=2&estado=Activa
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] InscripcionQuery query)
        {
            var inscripciones = await _service.GetPagedAsync(query);
            return Ok(inscripciones);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var inscripcion = await _service.GetByIdAsync(id);
            return Ok(inscripcion);
        }

        // 404 si el alumno o la materia no existen, 409 si ya hay una inscripción activa.
        [HttpPost]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Inscribir(CrearInscripcionDto dto)
        {
            var creada = await _service.InscribirAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = creada.Id }, creada);
        }

        // Idempotente: si ya estaba de baja responde 204 igual y conserva la fecha original.
        [HttpPatch("{id:int}/baja")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> DarDeBaja(int id)
        {
            await _service.DarDeBajaAsync(id);
            return NoContent();
        }
    }
}
