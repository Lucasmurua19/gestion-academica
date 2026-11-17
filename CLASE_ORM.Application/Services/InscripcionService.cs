using CLASE_ORM.Application.DTO.Common;
using CLASE_ORM.Application.DTO.Inscripcion;
using CLASE_ORM.Application.Exceptions;
using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Domain.Entities;

namespace CLASE_ORM.Application.Services
{
    public class InscripcionService : IInscripcionService
    {
        private readonly IInscripcionRepository _inscripciones;
        private readonly IAlumnoRepository _alumnos;
        private readonly IMateriaRepository _materias;
        private readonly IUnitOfWork _unitOfWork;
        private readonly TimeProvider _timeProvider;

        public InscripcionService(
            IInscripcionRepository inscripciones,
            IAlumnoRepository alumnos,
            IMateriaRepository materias,
            IUnitOfWork unitOfWork,
            TimeProvider timeProvider)
        {
            _inscripciones = inscripciones;
            _alumnos = alumnos;
            _materias = materias;
            _unitOfWork = unitOfWork;
            _timeProvider = timeProvider;
        }

        public Task<PagedResult<InscripcionDto>> GetPagedAsync(InscripcionQuery query)
        {
            return _inscripciones.GetPagedAsync(query);
        }

        public async Task<InscripcionDto> GetByIdAsync(int id)
        {
            var inscripcion = await _inscripciones.GetDtoByIdAsync(id);
            if (inscripcion == null) throw new NotFoundException($"No existe la inscripción con id {id}.");

            return inscripcion;
        }

        public async Task<InscripcionDto> InscribirAsync(CrearInscripcionDto dto)
        {
            var alumno = await _alumnos.GetByIdAsync(dto.AlumnoId);
            if (alumno == null) throw new NotFoundException($"No existe el alumno con id {dto.AlumnoId}.");

            var materia = await _materias.GetByIdAsync(dto.MateriaId);
            if (materia == null) throw new NotFoundException($"No existe la materia con id {dto.MateriaId}.");

            var mensajeDuplicada = $"{alumno.Nombre} ya tiene una inscripción activa en {materia.Nombre}.";

            // Un alumno no puede tener dos inscripciones activas en la misma materia (sí puede reinscribirse tras una baja).
            if (await _inscripciones.ExisteActivaAsync(alumno.Id, materia.Id))
            {
                throw new ConflictException(mensajeDuplicada);
            }

            var inscripcion = new Inscripcion
            {
                AlumnoId = alumno.Id,
                MateriaId = materia.Id,
                FechaAltaUtc = _timeProvider.GetUtcNow().UtcDateTime,
                Estado = EstadoInscripcion.Activa
            };

            await _inscripciones.AddAsync(inscripcion);

            try
            {
                await _unitOfWork.SaveChangesAsync();
            }
            catch (UniqueConstraintViolationException)
            {
                // Dos altas simultáneas pasaron el chequeo de arriba: el índice único de la base es el que frena a la segunda.
                throw new ConflictException(mensajeDuplicada);
            }

            return new InscripcionDto
            {
                Id = inscripcion.Id,
                AlumnoId = alumno.Id,
                AlumnoNombre = alumno.Nombre,
                MateriaId = materia.Id,
                MateriaNombre = materia.Nombre,
                Estado = inscripcion.Estado,
                FechaAltaUtc = inscripcion.FechaAltaUtc,
                FechaBajaUtc = inscripcion.FechaBajaUtc
            };
        }

        public async Task DarDeBajaAsync(int id)
        {
            var inscripcion = await _inscripciones.GetByIdAsync(id);
            if (inscripcion == null) throw new NotFoundException($"No existe la inscripción con id {id}.");

            // Si ya estaba de baja no cambia nada: se conserva la fecha original.
            if (inscripcion.DarDeBaja(_timeProvider.GetUtcNow().UtcDateTime))
            {
                await _unitOfWork.SaveChangesAsync();
            }
        }
    }
}
