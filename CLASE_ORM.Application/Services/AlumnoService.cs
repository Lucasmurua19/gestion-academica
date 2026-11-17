using CLASE_ORM.Application.DTO.Alumno;
using CLASE_ORM.Application.DTO.Common;
using CLASE_ORM.Application.Exceptions;
using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Domain.Entities;

namespace CLASE_ORM.Application.Services
{
    public class AlumnoService : IAlumnoService
    {
        private readonly IAlumnoRepository _alumnos;
        private readonly IUnitOfWork _unitOfWork;

        public AlumnoService(IAlumnoRepository alumnos, IUnitOfWork unitOfWork)
        {
            _alumnos = alumnos;
            _unitOfWork = unitOfWork;
        }

        public Task<PagedResult<AlumnoDto>> GetPagedAsync(AlumnoQuery query)
        {
            return _alumnos.GetPagedAsync(query);
        }

        public async Task<AlumnoDto> GetByIdAsync(int id)
        {
            var alumno = await _alumnos.GetDtoByIdAsync(id);
            if (alumno == null) throw new NotFoundException($"No existe el alumno con id {id}.");

            return alumno;
        }

        public async Task<AlumnoDto> CreateAsync(CrearAlumnoDto dto)
        {
            var alumno = new Alumno
            {
                Nombre = dto.Nombre.Trim(),
                Email = dto.Email.Trim(),
            };

            await _alumnos.AddAsync(alumno);
            await _unitOfWork.SaveChangesAsync();

            return new AlumnoDto
            {
                Id = alumno.Id,
                Nombre = alumno.Nombre,
                Email = alumno.Email,
            };
        }

        public async Task UpdateAsync(int id, ActualizarAlumnoDto dto)
        {
            var existing = await _alumnos.GetByIdAsync(id);
            if (existing == null) throw new NotFoundException($"No existe el alumno con id {id}.");

            existing.Nombre = dto.Nombre.Trim();
            existing.Email = dto.Email.Trim();

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var alumno = await _alumnos.GetByIdAsync(id);
            if (alumno == null) throw new NotFoundException($"No existe el alumno con id {id}.");

            // Regla: el historial de inscripciones se conserva, así que un alumno con inscripciones
            // (activas o de baja) no se puede eliminar.
            var inscripciones = await _alumnos.CountInscripcionesAsync(id);
            if (inscripciones > 0)
            {
                var cantidad = inscripciones == 1 ? "1 inscripción registrada" : $"{inscripciones} inscripciones registradas";

                throw new ConflictException(
                    $"No se puede eliminar al alumno \"{alumno.Nombre}\" porque tiene {cantidad}. " +
                    "El historial de inscripciones se conserva.");
            }

            _alumnos.Remove(alumno);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
