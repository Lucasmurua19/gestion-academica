using CLASE_ORM.Application.DTO.Alumno;
using CLASE_ORM.Application.DTO.Common;
using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CLASE_ORM.Infrastructure.Persistence.Repositories
{
    public class AlumnoRepository : IAlumnoRepository
    {
        private readonly AppDbContext _context;

        public AlumnoRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task<PagedResult<AlumnoDto>> GetPagedAsync(AlumnoQuery query)
        {
            var alumnos = _context.Alumnos.AsNoTracking();

            // 1) Filtro (antes de contar y de paginar)
            var search = query.Search?.Trim();
            if (!string.IsNullOrEmpty(search))
            {
                alumnos = alumnos.Where(a => a.Nombre.Contains(search) || a.Email.Contains(search));
            }

            // 2) Orden estable: si dos alumnos se llaman igual, el Id desempata y las páginas no se repiten ni se saltean filas.
            return alumnos
                .OrderBy(a => a.Nombre)
                .ThenBy(a => a.Id)
                .ToPagedResultAsync(query.Page, query.PageSize, a => new AlumnoDto
                {
                    Id = a.Id,
                    Nombre = a.Nombre,
                    Email = a.Email,
                });
        }

        public Task<AlumnoDto?> GetDtoByIdAsync(int id)
        {
            return _context.Alumnos
                .AsNoTracking()
                .Where(a => a.Id == id)
                .Select(a => new AlumnoDto
                {
                    Id = a.Id,
                    Nombre = a.Nombre,
                    Email = a.Email,
                })
                .FirstOrDefaultAsync();
        }

        public async Task<Alumno?> GetByIdAsync(int id)
        {
            return await _context.Alumnos.FindAsync(id);
        }

        public Task<int> CountInscripcionesAsync(int alumnoId)
        {
            return _context.Inscripciones.CountAsync(i => i.AlumnoId == alumnoId);
        }

        public async Task AddAsync(Alumno alumno)
        {
            await _context.Alumnos.AddAsync(alumno);
        }

        public void Remove(Alumno alumno)
        {
            _context.Alumnos.Remove(alumno);
        }
    }
}
