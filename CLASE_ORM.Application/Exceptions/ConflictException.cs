namespace CLASE_ORM.Application.Exceptions
{
    // La operación choca con el estado actual de los datos (email repetido, materia con alumnos, etc.) -> 409
    public class ConflictException : Exception
    {
        public ConflictException(string message) : base(message)
        {
        }
    }
}
