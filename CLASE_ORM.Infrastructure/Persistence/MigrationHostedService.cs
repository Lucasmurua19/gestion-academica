using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CLASE_ORM.Infrastructure.Persistence
{
    // Aplica las migraciones al arrancar cuando Database:MigrateOnStartup es true. Es un IHostedService (corre en app.Run()
    // y no cuando las herramientas de EF construyen el host) y se registra ANTES del sembrado del administrador, porque
    // los servicios de arranque se inician en orden y el sembrado necesita las tablas creadas.
    public class MigrationHostedService : IHostedService
    {
        // Con docker-compose el contenedor de SQL Server puede tardar en aceptar conexiones: se reintenta unos segundos.
        private const int MaxIntentos = 30;
        private static readonly TimeSpan EsperaEntreIntentos = TimeSpan.FromSeconds(3);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly DatabaseSettings _settings;
        private readonly ILogger<MigrationHostedService> _logger;

        public MigrationHostedService(
            IServiceScopeFactory scopeFactory,
            IOptions<DatabaseSettings> options,
            ILogger<MigrationHostedService> logger)
        {
            _scopeFactory = scopeFactory;
            _settings = options.Value;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            if (!_settings.MigrateOnStartup) return;

            for (var intento = 1; ; intento++)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    await context.Database.MigrateAsync(cancellationToken);

                    _logger.LogInformation("Base de datos lista: migraciones aplicadas.");
                    return;
                }
                catch (Exception ex) when (intento < MaxIntentos && !cancellationToken.IsCancellationRequested)
                {
                    _logger.LogWarning("No se pudo conectar o migrar la base (intento {Intento}/{Max}): {Mensaje}", intento, MaxIntentos, ex.Message);
                    await Task.Delay(EsperaEntreIntentos, cancellationToken);
                }
            }
            // Si se agotan los intentos la excepción sube y la API no arranca: sin base de datos no sirve de nada.
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}
