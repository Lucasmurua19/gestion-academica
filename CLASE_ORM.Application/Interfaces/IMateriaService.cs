using CLASE_ORM.Application.DTO.Common;
using CLASE_ORM.Application.DTO.Materia;

namespace CLASE_ORM.Application.Interfaces
{
    public interface IMateriaService
    {
        Task<PagedResult<MateriaDto>> GetPagedAsync(MateriaQuery query);
        Task<List<MateriaDto>> GetAllAsync();
        Task<MateriaDto> GetByIdAsync(int id);
        Task<MateriaDto> CreateAsync(CrearMateriaDto dto);
        Task UpdateAsync(int id, CrearMateriaDto dto);
        Task DeleteAsync(int id);
    }
}
