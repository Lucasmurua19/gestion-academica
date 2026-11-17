using CLASE_ORM.Application.DTO.Alumno;
using CLASE_ORM.Application.DTO.Common;

namespace CLASE_ORM.Application.Interfaces
{
    public interface IAlumnoService
    {
        Task<PagedResult<AlumnoDto>> GetPagedAsync(AlumnoQuery query);
        Task<AlumnoDto> GetByIdAsync(int id);
        Task<AlumnoDto> CreateAsync(CrearAlumnoDto dto);
        Task UpdateAsync(int id, ActualizarAlumnoDto dto);
        Task DeleteAsync(int id);
    }
}
