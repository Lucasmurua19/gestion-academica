namespace CLASE_ORM.Infrastructure.Security
{
    // Sección "Jwt" de appsettings.json (la Key conviene guardarla en user-secrets / variables de entorno).
    public class JwtSettings
    {
        // Nombres cortos de los claims del token. El Api los usa al validarlo para que coincidan con los que se emiten acá.
        public const string NameClaimType = "name";
        public const string RoleClaimType = "role";

        public string Key { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int ExpireMinutes { get; set; } = 60;
    }
}
