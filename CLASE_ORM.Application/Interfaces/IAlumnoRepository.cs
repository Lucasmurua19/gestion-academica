using CLASE_ORM.Application.DTO.Alumno;
using CLASE_ORM.Application.DTO.Common;
using CLASE_ORM.Domain.Entities;

namespace CLASE_ORM.Application.Interfaces
{
    public interface IAlumnoRepository
    {
        Task<PagedResult<AlumnoDto>> GetPagedAsync(AlumnoQuery query);
        Task<AlumnoDto?> GetDtoByIdAsync(int id);
        Task<Alumno?> GetByIdAsync(int id);
        Task<int> CountInscripcionesAsync(int alumnoId);
        Task AddAsync(Alumno alumno);
        void Remove(Alumno alumno);
    }
}
