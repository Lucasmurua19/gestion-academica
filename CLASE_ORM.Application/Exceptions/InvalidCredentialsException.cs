namespace CLASE_ORM.Application.Exceptions
{
    // Email o contraseña incorrectos -> 401
    public class InvalidCredentialsException : Exception
    {
        public InvalidCredentialsException() : base("Email o contraseña incorrectos.")
        {
        }
    }
}
