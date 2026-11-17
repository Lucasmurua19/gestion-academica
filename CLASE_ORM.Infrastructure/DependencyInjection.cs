using CLASE_ORM.Application.Interfaces;
using CLASE_ORM.Infrastructure.Persistence;
using CLASE_ORM.Infrastructure.Persistence.Repositories;
using CLASE_ORM.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CLASE_ORM.Infrastructure
{
    public static class DependencyInjection
    {
        // Conecta las interfaces de Application con sus implementaciones (EF Core, BCrypt, JWT).
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<AppDbContext>
                (options => options.UseSqlServer(configuration.GetConnectionString("Con"))
            );

            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped<IAlumnoRepository, AlumnoRepository>();
            services.AddScoped<IMateriaRepository, MateriaRepository>();
            services.AddScoped<IUsuarioRepository, UsuarioRepository>();
            services.AddScoped<IInscripcionRepository, InscripcionRepository>();
            services.AddScoped<IResumenAcademicoRepository, ResumenAcademicoRepository>();

            services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
            services.Configure<AdminSeedSettings>(configuration.GetSection("AdminSeed"));
            services.Configure<DatabaseSettings>(configuration.GetSection("Database"));

            services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
            services.AddSingleton<ITokenService, JwtTokenService>();

            // El orden importa: primero las migraciones (si están habilitadas) y recién después el sembrado del administrador.
            services.AddHostedService<MigrationHostedService>();
            services.AddHostedService<AdminSeedHostedService>();

            return services;
        }
    }
}
