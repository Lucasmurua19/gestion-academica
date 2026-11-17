using CLASE_ORM.Application.DTO.Common;
using CLASE_ORM.Application.DTO.Inscripcion;
using CLASE_ORM.Domain.Entities;

namespace CLASE_ORM.Application.Interfaces
{
    public interface IInscripcionRepository
    {
        Task<PagedResult<InscripcionDto>> GetPagedAsync(InscripcionQuery query);
        Task<InscripcionDto?> GetDtoByIdAsync(int id);
        Task<Inscripcion?> GetByIdAsync(int id);
        Task<bool> ExisteActivaAsync(int alumnoId, int materiaId);
        Task AddAsync(Inscripcion inscripcion);
    }
}
