using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CLASE_ORM.Infrastructure.Persistence.Repositories
{
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly AppDbContext _context;

        public UsuarioRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task<Usuario?> GetByEmailAsync(string email)
        {
            return _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
        }

        public Task<bool> ExistsByEmailAsync(string email)
        {
            return _context.Usuarios.AnyAsync(u => u.Email == email);
        }

        public async Task AddAsync(Usuario usuario)
        {
            await _context.Usuarios.AddAsync(usuario);
        }
    }
}
