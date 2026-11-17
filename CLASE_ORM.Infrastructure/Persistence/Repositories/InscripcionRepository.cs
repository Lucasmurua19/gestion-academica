using System.Linq.Expressions;
using CLASE_ORM.Application.DTO.Common;
using CLASE_ORM.Application.DTO.Inscripcion;
using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CLASE_ORM.Infrastructure.Persistence.Repositories
{
    public class InscripcionRepository : IInscripcionRepository
    {
        private readonly AppDbContext _context;

        public InscripcionRepository(AppDbContext context)
        {
            _context = context;
        }

        // Se arma una sola vez para que el listado y el GET por id devuelvan exactamente lo mismo.
        private static readonly Expression<Func<Inscripcion, InscripcionDto>> ADto = i => new InscripcionDto
        {
            Id = i.Id,
            AlumnoId = i.AlumnoId,
            AlumnoNombre = i.Alumno.Nombre,
            MateriaId = i.MateriaId,
            MateriaNombre = i.Materia.Nombre,
            Estado = i.Estado,
            FechaAltaUtc = i.FechaAltaUtc,
            FechaBajaUtc = i.FechaBajaUtc,
        };

        public Task<PagedResult<InscripcionDto>> GetPagedAsync(InscripcionQuery query)
        {
            var inscripciones = _context.Inscripciones.AsNoTracking();

            // 1) Filtros (antes de contar y de paginar)
            if (query.AlumnoId.HasValue)
            {
                inscripciones = inscripciones.Where(i => i.AlumnoId == query.AlumnoId.Value);
            }

            if (query.MateriaId.HasValue)
            {
                inscripciones = inscripciones.Where(i => i.MateriaId == query.MateriaId.Value);
            }

            if (query.Estado.HasValue)
            {
                inscripciones = inscripciones.Where(i => i.Estado == query.Estado.Value);
            }

            // 2) Orden estable: las más nuevas primero y el Id desempata (las inscripciones heredadas comparten fecha).
            return inscripciones
                .OrderByDescending(i => i.FechaAltaUtc)
                .ThenByDescending(i => i.Id)
                .ToPagedResultAsync(query.Page, query.PageSize, ADto);
        }

        public Task<InscripcionDto?> GetDtoByIdAsync(int id)
        {
            return _context.Inscripciones
                .AsNoTracking()
                .Where(i => i.Id == id)
                .Select(ADto)
                .FirstOrDefaultAsync();
        }

        public async Task<Inscripcion?> GetByIdAsync(int id)
        {
            return await _context.Inscripciones.FindAsync(id);
        }

        public Task<bool> ExisteActivaAsync(int alumnoId, int materiaId)
        {
            return _context.Inscripciones.AnyAsync(i =>
                i.AlumnoId == alumnoId &&
                i.MateriaId == materiaId &&
                i.Estado == EstadoInscripcion.Activa);
        }

        public async Task AddAsync(Inscripcion inscripcion)
        {
            await _context.Inscripciones.AddAsync(inscripcion);
        }
    }
}
