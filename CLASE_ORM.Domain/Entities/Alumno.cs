namespace CLASE_ORM.Domain.Entities
{
    public class Alumno
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        // Las materias que cursa (o cursó) el alumno se gestionan desde Inscripciones.
        public List<Inscripcion> Inscripciones { get; set; } = new();
    }
}
