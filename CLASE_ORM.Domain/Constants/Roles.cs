namespace CLASE_ORM.Domain.Constants
{
    // Roles del sistema. "Admin" puede dar de alta, modificar y eliminar; "Consulta" solo lee.
    public static class Roles
    {
        public const string Admin = "Admin";
        public const string Consulta = "Consulta";

        // Para usar en [Authorize(Roles = ...)] cuando alcanza con cualquiera de los dos roles.
        public const string AdminOConsulta = Admin + "," + Consulta;

        public static bool EsValido(string? rol) => rol == Admin || rol == Consulta;
    }
}
