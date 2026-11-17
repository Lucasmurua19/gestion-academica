using System.ComponentModel.DataAnnotations;

namespace CLASE_ORM.Application.DTO.Common
{
    // Parámetros comunes de los listados paginados (query string: ?page=1&pageSize=10).
    public class PagedQuery
    {
        [Range(1, int.MaxValue, ErrorMessage = "La página debe ser mayor o igual a 1.")]
        public int Page { get; set; } = 1;

        [Range(1, 100, ErrorMessage = "El tamaño de página debe estar entre 1 y 100.")]
        public int PageSize { get; set; } = 10;
    }
}
