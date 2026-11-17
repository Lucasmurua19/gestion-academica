using CLASE_ORM.Domain.Entities;

namespace CLASE_ORM.Application.DTO.Inscripcion
{
    public class InscripcionDto
    {
        public int Id { get; set; }
        public int AlumnoId { get; set; }
        public string AlumnoNombre { get; set; } = string.Empty;
        public int MateriaId { get; set; }
        public string MateriaNombre { get; set; } = string.Empty;
        public EstadoInscripcion Estado { get; set; }
        public DateTime FechaAltaUtc { get; set; }
        public DateTime? FechaBajaUtc { get; set; }
    }
}
