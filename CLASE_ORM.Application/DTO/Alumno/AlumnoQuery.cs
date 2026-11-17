using System.ComponentModel.DataAnnotations;
using CLASE_ORM.Application.DTO.Common;

namespace CLASE_ORM.Application.DTO.Alumno
{
    // GET /api/Alumno?page=1&pageSize=10&search=ana
    public class AlumnoQuery : PagedQuery
    {
        [StringLength(100, ErrorMessage = "La búsqueda no puede superar los 100 caracteres.")]
        public string? Search { get; set; }
    }
}
