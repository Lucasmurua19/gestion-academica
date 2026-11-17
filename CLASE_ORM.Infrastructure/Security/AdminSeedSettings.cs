namespace CLASE_ORM.Infrastructure.Security
{
    // Sección "AdminSeed": cuenta administrativa inicial. No tiene valores en appsettings.json a propósito:
    //   dotnet user-secrets set "AdminSeed:Email" "admin@ejemplo.com"
    //   dotnet user-secrets set "AdminSeed:Password" "una-clave-segura"
    // (o las variables de entorno AdminSeed__Email / AdminSeed__Password). Si falta alguno, no se crea ningún administrador.
    public class AdminSeedSettings
    {
        public string Nombre { get; set; } = "Administrador";
        public string? Email { get; set; }
        public string? Password { get; set; }
    }
}
