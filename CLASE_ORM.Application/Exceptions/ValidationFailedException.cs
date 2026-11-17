namespace CLASE_ORM.Application.Exceptions
{
    // Una regla de validación de negocio falló (ej: la materia indicada no existe) -> 400 con errores por campo
    public class ValidationFailedException : Exception
    {
        public IDictionary<string, string[]> Errors { get; }

        public ValidationFailedException(string campo, string mensaje)
            : base(mensaje)
        {
            Errors = new Dictionary<string, string[]> { [campo] = new[] { mensaje } };
        }
    }
}
