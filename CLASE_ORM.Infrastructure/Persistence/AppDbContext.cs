using CLASE_ORM.Domain.Constants;
using CLASE_ORM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CLASE_ORM.Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {

        // AppDbContext - AplicationDbContext

        public AppDbContext(DbContextOptions<AppDbContext> options): base (options)
        {

        }

        // add-migration, update-database, remove-migration, drop-database.

        public DbSet<Alumno> Alumnos { get; set; }
        public DbSet<Materia> Materias { get; set; }
        public DbSet<Profesor> Profesores { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Inscripcion> Inscripciones { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Inscripcion>(inscripcion =>
            {
                // Política de borrado: la base NO elimina en cascada. Se conserva el historial: ni un alumno ni una materia
                // con inscripciones se pueden borrar (la API responde 409 antes de llegar acá; esto es la red de seguridad).
                inscripcion.HasOne(i => i.Alumno)
                    .WithMany(a => a.Inscripciones)
                    .HasForeignKey(i => i.AlumnoId)
                    .OnDelete(DeleteBehavior.Restrict);

                inscripcion.HasOne(i => i.Materia)
                    .WithMany(m => m.Inscripciones)
                    .HasForeignKey(i => i.MateriaId)
                    .OnDelete(DeleteBehavior.Restrict);

                // El estado se guarda como texto ("Activa" / "Baja") para que la tabla se entienda a simple vista.
                inscripcion.Property(i => i.Estado)
                    .HasConversion<string>()
                    .HasMaxLength(10);

                // SQL Server devuelve las fechas sin zona (Kind = Unspecified). Se marcan como UTC al leerlas para que
                // la API las serialice con "Z" y Angular las muestre en la hora local del navegador.
                inscripcion.Property(i => i.FechaAltaUtc)
                    .HasConversion(v => v, v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

                inscripcion.Property(i => i.FechaBajaUtc)
                    .HasConversion(v => v, v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

                // Un alumno no puede tener dos inscripciones ACTIVAS en la misma materia. El índice es único solo entre las
                // filas activas: después de una baja se puede reinscribir y el historial queda intacto. Además protege contra
                // dos altas simultáneas, que el chequeo de la aplicación por sí solo no alcanza a frenar.
                // El filtro compara con el valor que EF guarda en la columna (el nombre del enum, ver HasConversion<string>).
                inscripcion.HasIndex(i => new { i.AlumnoId, i.MateriaId })
                    .IsUnique()
                    .HasDatabaseName("UX_Inscripciones_AlumnoId_MateriaId_Activa")
                    .HasFilter($"[Estado] = N'{nameof(EstadoInscripcion.Activa)}'");
            });

            // Los usuarios que ya existían quedan como "Consulta".
            modelBuilder.Entity<Usuario>()
                .Property(u => u.Rol)
                .HasMaxLength(20)
                .HasDefaultValue(Roles.Consulta);
        }

    }
}
