using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CLASE_ORM.Application
{
    public static class DependencyInjection
    {
        // Registra los casos de uso. Las implementaciones de persistencia y seguridad las aporta Infrastructure.
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            // El reloj se inyecta para no depender de DateTime.UtcNow dentro de las reglas.
            services.AddSingleton(TimeProvider.System);

            services.AddScoped<IAlumnoService, AlumnoService>();
            services.AddScoped<IMateriaService, MateriaService>();
            services.AddScoped<IInscripcionService, InscripcionService>();
            services.AddScoped<IDashboardService, DashboardService>();
            services.AddScoped<IAuthService, AuthService>();

            return services;
        }
    }
}
