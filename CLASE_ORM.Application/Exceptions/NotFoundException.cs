namespace CLASE_ORM.Application.Exceptions
{
    // El recurso pedido no existe -> 404
    public class NotFoundException : Exception
    {
        public NotFoundException(string message) : base(message)
        {
        }
    }
}
