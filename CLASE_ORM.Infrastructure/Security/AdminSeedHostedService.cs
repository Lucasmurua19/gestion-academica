using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Domain.Constants;
using CLASE_ORM.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CLASE_ORM.Infrastructure.Security
{
    // Mecanismo controlado para tener un Admin: al arrancar, si hay un AdminSeed configurado en el servidor,
    // se crea esa cuenta (o se promueve la que ya tenga ese email). Nunca pisa la contraseña de un usuario existente.
    // Es un IHostedService, así que corre en app.Run() y no cuando las herramientas de EF construyen el host.
    public class AdminSeedHostedService : IHostedService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly AdminSeedSettings _settings;
        private readonly ILogger<AdminSeedHostedService> _logger;

        public AdminSeedHostedService(
            IServiceScopeFactory scopeFactory,
            IOptions<AdminSeedSettings> options,
            ILogger<AdminSeedHostedService> logger)
        {
            _scopeFactory = scopeFactory;
            _settings = options.Value;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            var email = _settings.Email?.Trim();

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(_settings.Password))
            {
                _logger.LogInformation("AdminSeed no está configurado: no se crea ninguna cuenta administrativa.");
                return;
            }

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var usuarios = scope.ServiceProvider.GetRequiredService<IUsuarioRepository>();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

                var existente = await usuarios.GetByEmailAsync(email);

                if (existente == null)
                {
                    await usuarios.AddAsync(new Usuario
                    {
                        Nombre = _settings.Nombre,
                        Email = email,
                        PasswordHash = hasher.Hash(_settings.Password),
                        Rol = Roles.Admin
                    });
                    await unitOfWork.SaveChangesAsync();

                    _logger.LogInformation("Se creó la cuenta administrativa {Email}.", email);
                }
                else if (existente.Rol != Roles.Admin)
                {
                    existente.Rol = Roles.Admin;
                    await unitOfWork.SaveChangesAsync();

                    _logger.LogInformation("El usuario {Email} fue promovido a {Rol}.", email, Roles.Admin);
                }
            }
            catch (Exception ex)
            {
                // No se tira abajo la API: lo más probable es que falten aplicar las migraciones.
                _logger.LogError(ex, "No se pudo sembrar la cuenta administrativa. ¿Aplicaste las migraciones (dotnet ef database update)?");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}
