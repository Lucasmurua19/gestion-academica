using System.ComponentModel.DataAnnotations;

namespace CLASE_ORM.Application.DTO.Inscripcion
{
    public class CrearInscripcionDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Tenés que elegir un alumno.")]
        public int AlumnoId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Tenés que elegir una materia.")]
        public int MateriaId { get; set; }
    }
}
