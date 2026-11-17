using System.ComponentModel.DataAnnotations;
using CLASE_ORM.Application.DTO.Common;
using CLASE_ORM.Domain.Entities;

namespace CLASE_ORM.Application.DTO.Inscripcion
{
    // GET /api/inscripciones?page=1&pageSize=10&alumnoId=3&materiaId=2&estado=Activa
    public class InscripcionQuery : PagedQuery
    {
        [Range(1, int.MaxValue, ErrorMessage = "El filtro de alumno no es válido.")]
        public int? AlumnoId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "El filtro de materia no es válido.")]
        public int? MateriaId { get; set; }

        [EnumDataType(typeof(EstadoInscripcion), ErrorMessage = "El estado debe ser Activa o Baja.")]
        public EstadoInscripcion? Estado { get; set; }
    }
}
