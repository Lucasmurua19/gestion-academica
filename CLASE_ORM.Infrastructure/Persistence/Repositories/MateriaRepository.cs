using CLASE_ORM.Application.DTO.Common;
using CLASE_ORM.Application.DTO.Materia;
using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CLASE_ORM.Infrastructure.Persistence.Repositories
{
    public class MateriaRepository : IMateriaRepository
    {
        private readonly AppDbContext _context;

        public MateriaRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task<PagedResult<MateriaDto>> GetPagedAsync(MateriaQuery query)
        {
            var materias = _context.Materias.AsNoTracking();

            var search = query.Search?.Trim();
            if (!string.IsNullOrEmpty(search))
            {
                materias = materias.Where(m => m.Nombre.Contains(search));
            }

            return materias
                .OrderBy(m => m.Nombre)
                .ThenBy(m => m.Id)
                .ToPagedResultAsync(query.Page, query.PageSize, m => new MateriaDto
                {
                    Id = m.Id,
                    Nombre = m.Nombre
                });
        }

        // Sin paginar: lo usan los desplegables (ej: elegir la materia de un alumno).
        public Task<List<MateriaDto>> GetAllAsync()
        {
            return _context.Materias
                .AsNoTracking()
                .OrderBy(m => m.Nombre)
                .ThenBy(m => m.Id)
                .Select(m => new MateriaDto
                {
                    Id = m.Id,
                    Nombre = m.Nombre
                })
                .ToListAsync();
        }

        public async Task<Materia?> GetByIdAsync(int id)
        {
            return await _context.Materias.FindAsync(id);
        }

        public Task<int> CountInscripcionesAsync(int materiaId)
        {
            return _context.Inscripciones.CountAsync(i => i.MateriaId == materiaId);
        }

        public async Task AddAsync(Materia materia)
        {
            await _context.Materias.AddAsync(materia);
        }

        public void Remove(Materia materia)
        {
            _context.Materias.Remove(materia);
        }
    }
}
