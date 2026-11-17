using CLASE_ORM.Application.Exceptions;
using CLASE_ORM.Application.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace CLASE_ORM.Infrastructure.Persistence
{
    public class UnitOfWork : IUnitOfWork
    {
        // Códigos de SQL Server: 2601 = índice único violado, 2627 = restricción UNIQUE/PRIMARY KEY violada.
        private const int IndiceUnicoViolado = 2601;
        private const int RestriccionUnicaViolada = 2627;

        private readonly AppDbContext _context;

        public UnitOfWork(AppDbContext context)
        {
            _context = context;
        }

        public async Task<int> SaveChangesAsync()
        {
            try
            {
                return await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: IndiceUnicoViolado or RestriccionUnicaViolada })
            {
                throw new UniqueConstraintViolationException(ex);
            }
        }
    }
}
