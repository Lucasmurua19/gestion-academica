using System.ComponentModel.DataAnnotations;

namespace CLASE_ORM.Application.DTO.Alumno
{
    public class ActualizarAlumnoDto
    {
        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "El email es obligatorio.")]
        [EmailAddress(ErrorMessage = "El email no tiene un formato válido.")]
        [StringLength(200, ErrorMessage = "El email no puede superar los 200 caracteres.")]
        public string Email { get; set; } = string.Empty;
    }
}
