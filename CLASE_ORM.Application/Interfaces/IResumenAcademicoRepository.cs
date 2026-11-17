using CLASE_ORM.Application.DTO.Dashboard;

namespace CLASE_ORM.Application.Interfaces
{
    // Consulta de solo lectura: los conteos y agrupaciones se resuelven en la base de datos.
    public interface IResumenAcademicoRepository
    {
        Task<ResumenAcademicoDto> ObtenerAsync(int? materiaId);
    }
}
