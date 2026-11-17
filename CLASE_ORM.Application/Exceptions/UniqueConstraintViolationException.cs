namespace CLASE_ORM.Application.Exceptions
{
    // La base de datos rechazó una fila por violar un índice único. Infrastructure la lanza al confirmar los cambios
    // para que Application pueda reaccionar sin conocer EF Core ni SQL Server (ver IUnitOfWork).
    public class UniqueConstraintViolationException : Exception
    {
        public UniqueConstraintViolationException(Exception inner)
            : base("Se violó un índice único de la base de datos.", inner)
        {
        }
    }
}
