using CLASE_ORM.Application.DTO.Common;
using CLASE_ORM.Application.DTO.Materia;
using CLASE_ORM.Application.Exceptions;
using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Domain.Entities;

namespace CLASE_ORM.Application.Services
{
    public class MateriaService : IMateriaService
    {
        private readonly IMateriaRepository _materias;
        private readonly IUnitOfWork _unitOfWork;

        public MateriaService(IMateriaRepository materias, IUnitOfWork unitOfWork)
        {
            _materias = materias;
            _unitOfWork = unitOfWork;
        }

        public Task<PagedResult<MateriaDto>> GetPagedAsync(MateriaQuery query)
        {
            return _materias.GetPagedAsync(query);
        }

        public Task<List<MateriaDto>> GetAllAsync()
        {
            return _materias.GetAllAsync();
        }

        public async Task<MateriaDto> GetByIdAsync(int id)
        {
            var materia = await _materias.GetByIdAsync(id);
            if (materia == null) throw new NotFoundException($"No existe la materia con id {id}.");

            return ToDto(materia);
        }

        public async Task<MateriaDto> CreateAsync(CrearMateriaDto dto)
        {
            var materia = new Materia
            {
                Nombre = dto.Nombre.Trim()
            };

            await _materias.AddAsync(materia);
            await _unitOfWork.SaveChangesAsync();

            return ToDto(materia);
        }

        public async Task UpdateAsync(int id, CrearMateriaDto dto)
        {
            var existing = await _materias.GetByIdAsync(id);
            if (existing == null) throw new NotFoundException($"No existe la materia con id {id}.");

            existing.Nombre = dto.Nombre.Trim();

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var materia = await _materias.GetByIdAsync(id);
            if (materia == null) throw new NotFoundException($"No existe la materia con id {id}.");

            // Regla: el historial de inscripciones se conserva, así que una materia con inscripciones
            // (activas o de baja) no se puede eliminar.
            var inscripciones = await _materias.CountInscripcionesAsync(id);
            if (inscripciones > 0)
            {
                var cantidad = inscripciones == 1 ? "1 inscripción registrada" : $"{inscripciones} inscripciones registradas";

                throw new ConflictException(
                    $"No se puede eliminar la materia \"{materia.Nombre}\" porque tiene {cantidad}. " +
                    "El historial de inscripciones se conserva.");
            }

            _materias.Remove(materia);
            await _unitOfWork.SaveChangesAsync();
        }

        private static MateriaDto ToDto(Materia materia)
        {
            return new MateriaDto
            {
                Id = materia.Id,
                Nombre = materia.Nombre
            };
        }
    }
}
