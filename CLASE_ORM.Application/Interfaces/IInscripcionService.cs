using CLASE_ORM.Application.DTO.Common;
using CLASE_ORM.Application.DTO.Inscripcion;

namespace CLASE_ORM.Application.Interfaces
{
    public interface IInscripcionService
    {
        Task<PagedResult<InscripcionDto>> GetPagedAsync(InscripcionQuery query);
        Task<InscripcionDto> GetByIdAsync(int id);
        Task<InscripcionDto> InscribirAsync(CrearInscripcionDto dto);
        Task DarDeBajaAsync(int id);
    }
}
