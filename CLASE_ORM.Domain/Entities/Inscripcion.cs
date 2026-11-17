namespace CLASE_ORM.Domain.Entities
{
    // Un alumno puede cursar varias materias y una materia tiene varios alumnos: Inscripcion es la tabla intermedia.
    // Las bajas no se borran: la fila queda con Estado = Baja y su fecha, así se conserva el historial.
    public class Inscripcion
    {
        public int Id { get; set; }

        public int AlumnoId { get; set; }
        public Alumno Alumno { get; set; } = null!;

        public int MateriaId { get; set; }
        public Materia Materia { get; set; } = null!;

        public DateTime FechaAltaUtc { get; set; }
        public DateTime? FechaBajaUtc { get; set; }

        public EstadoInscripcion Estado { get; set; } = EstadoInscripcion.Activa;

        // Regla: dar de baja una inscripción que ya está de baja no hace nada y conserva la fecha original.
        public bool DarDeBaja(DateTime ahoraUtc)
        {
            if (Estado == EstadoInscripcion.Baja) return false;

            Estado = EstadoInscripcion.Baja;
            FechaBajaUtc = ahoraUtc;
            return true;
        }
    }
}
