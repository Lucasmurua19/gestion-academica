using CLASE_ORM.Application.DTO.Dashboard;

namespace CLASE_ORM.Application.Interfaces
{
    public interface IDashboardService
    {
        Task<ResumenAcademicoDto> ObtenerResumenAsync(ResumenAcademicoQuery query);
    }
}
