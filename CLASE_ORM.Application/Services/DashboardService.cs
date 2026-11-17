using CLASE_ORM.Application.DTO.Dashboard;
using CLASE_ORM.Application.Exceptions;
using CLASE_ORM.Application.Interfaces;

namespace CLASE_ORM.Application.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IResumenAcademicoRepository _resumen;
        private readonly IMateriaRepository _materias;

        public DashboardService(IResumenAcademicoRepository resumen, IMateriaRepository materias)
        {
            _resumen = resumen;
            _materias = materias;
        }

        public async Task<ResumenAcademicoDto> ObtenerResumenAsync(ResumenAcademicoQuery query)
        {
            // Un id con formato válido pero de una materia que no existe es un 404, no un resumen en cero.
            if (query.MateriaId.HasValue && await _materias.GetByIdAsync(query.MateriaId.Value) == null)
            {
                throw new NotFoundException($"No existe la materia con id {query.MateriaId.Value}.");
            }

            return await _resumen.ObtenerAsync(query.MateriaId);
        }
    }
}
