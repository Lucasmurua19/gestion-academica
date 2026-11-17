namespace CLASE_ORM.Application.DTO.Dashboard
{
    public class ResumenAcademicoDto
    {
        // Totales de registros: no dependen del filtro de materia.
        public int TotalAlumnosRegistrados { get; set; }
        public int TotalMateriasRegistradas { get; set; }

        // Dependen del filtro: con materiaId solo cuentan las inscripciones activas de esa materia.
        public int TotalInscripcionesActivas { get; set; }

        // Alumnos distintos con al menos una inscripción activa (un alumno en dos materias cuenta una vez).
        public int AlumnosInscriptosActivos { get; set; }

        // Una fila por materia (incluidas las que tienen cero) o solo la elegida.
        public IReadOnlyList<InscripcionesPorMateriaDto> InscripcionesPorMateria { get; set; } = Array.Empty<InscripcionesPorMateriaDto>();
    }

    public class InscripcionesPorMateriaDto
    {
        public int MateriaId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public int CantidadActivas { get; set; }
    }
}
