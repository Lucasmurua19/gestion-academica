namespace CLASE_ORM.Application.Interfaces
{
    // Confirma en la base de datos los cambios que hicieron los repositorios.
    // Si la base rechaza una fila por un índice único, lanza UniqueConstraintViolationException.
    public interface IUnitOfWork
    {
        Task<int> SaveChangesAsync();
    }
}
