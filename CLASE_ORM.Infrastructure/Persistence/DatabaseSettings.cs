namespace CLASE_ORM.Infrastructure.Persistence
{
    // Sección "Database" de la configuración.
    public class DatabaseSettings
    {
        // Si es true, la API aplica las migraciones pendientes (y crea la base si no existe) al arrancar.
        // Apagado por defecto: en desarrollo se usa "dotnet ef database update". Lo enciende docker-compose,
        // porque dentro del contenedor no existe la herramienta dotnet-ef.
        public bool MigrateOnStartup { get; set; }
    }
}
