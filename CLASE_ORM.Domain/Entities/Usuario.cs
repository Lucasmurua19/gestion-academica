using CLASE_ORM.Domain.Constants;

namespace CLASE_ORM.Domain.Entities
{
    public class Usuario
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        // Todo usuario nuevo arranca como "Consulta"; "Admin" se asigna por un mecanismo controlado (ver AdminSeed).
        public string Rol { get; set; } = Roles.Consulta;
    }
}
