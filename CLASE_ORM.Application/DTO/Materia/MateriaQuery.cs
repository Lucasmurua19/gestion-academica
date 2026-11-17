using System.ComponentModel.DataAnnotations;
using CLASE_ORM.Application.DTO.Common;

namespace CLASE_ORM.Application.DTO.Materia
{
    // GET /api/Materia?page=1&pageSize=10&search=mate
    public class MateriaQuery : PagedQuery
    {
        [StringLength(100, ErrorMessage = "La búsqueda no puede superar los 100 caracteres.")]
        public string? Search { get; set; }
    }
}
