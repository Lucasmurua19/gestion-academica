using CLASE_ORM.Application.DTO.Dashboard;
using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CLASE_ORM.Infrastructure.Persistence.Repositories
{
    // Todos los conteos y agrupaciones se traducen a SQL: no se trae ninguna fila a memoria para contarla.
    public class ResumenAcademicoRepository : IResumenAcademicoRepository
    {
        private readonly AppDbContext _context;

        public ResumenAcademicoRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ResumenAcademicoDto> ObtenerAsync(int? materiaId)
        {
            // Totales de registros: no dependen del filtro.
            var totalAlumnos = await _context.Alumnos.CountAsync();
            var totalMaterias = await _context.Materias.CountAsync();

            // Inscripciones activas (todas, o solo las de la materia elegida).
            var activas = _context.Inscripciones
                .AsNoTracking()
                .Where(i => i.Estado == EstadoInscripcion.Activa);

            var materias = _context.Materias.AsNoTracking();

            if (materiaId.HasValue)
            {
                activas = activas.Where(i => i.MateriaId == materiaId.Value);
                materias = materias.Where(m => m.Id == materiaId.Value);
            }

            var totalActivas = await activas.CountAsync();

            // Distinct: un alumno inscripto en dos materias cuenta una sola vez.
            var alumnosInscriptos = await activas.Select(i => i.AlumnoId).Distinct().CountAsync();

            // Parte de Materias (y no de Inscripciones) para que las materias sin inscripciones activas aparezcan con 0.
            var porMateria = await materias
                .OrderBy(m => m.Nombre)
                .ThenBy(m => m.Id)
                .Select(m => new InscripcionesPorMateriaDto
                {
                    MateriaId = m.Id,
                    Nombre = m.Nombre,
                    CantidadActivas = m.Inscripciones.Count(i => i.Estado == EstadoInscripcion.Activa)
                })
                .ToListAsync();

            return new ResumenAcademicoDto
            {
                TotalAlumnosRegistrados = totalAlumnos,
                TotalMateriasRegistradas = totalMaterias,
                TotalInscripcionesActivas = totalActivas,
                AlumnosInscriptosActivos = alumnosInscriptos,
                InscripcionesPorMateria = porMateria
            };
        }
    }
}
