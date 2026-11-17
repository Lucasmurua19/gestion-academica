using System.ComponentModel.DataAnnotations;

namespace CLASE_ORM.Application.DTO.Dashboard
{
    // GET /api/dashboard-academico?materiaId=2
    public class ResumenAcademicoQuery
    {
        [Range(1, int.MaxValue, ErrorMessage = "El filtro de materia no es válido.")]
        public int? MateriaId { get; set; }
    }
}
