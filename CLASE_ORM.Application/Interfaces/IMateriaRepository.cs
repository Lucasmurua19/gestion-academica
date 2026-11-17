using CLASE_ORM.Application.DTO.Common;
using CLASE_ORM.Application.DTO.Materia;
using CLASE_ORM.Domain.Entities;

namespace CLASE_ORM.Application.Interfaces
{
    public interface IMateriaRepository
    {
        Task<PagedResult<MateriaDto>> GetPagedAsync(MateriaQuery query);
        Task<List<MateriaDto>> GetAllAsync();
        Task<Materia?> GetByIdAsync(int id);
        Task<int> CountInscripcionesAsync(int materiaId);
        Task AddAsync(Materia materia);
        void Remove(Materia materia);
    }
}
