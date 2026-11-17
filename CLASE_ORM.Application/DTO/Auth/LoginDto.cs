using System.ComponentModel.DataAnnotations;

namespace CLASE_ORM.Application.DTO.Auth
{
    public class LoginDto
    {
        [Required(ErrorMessage = "El email es obligatorio.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        public string Password { get; set; } = string.Empty;
    }
}
