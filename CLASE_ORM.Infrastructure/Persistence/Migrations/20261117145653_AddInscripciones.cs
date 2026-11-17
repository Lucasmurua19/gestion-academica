using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CLASE_ORM.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    // Pasa de "cada alumno tiene UNA materia" (Alumnos.MateriaId) a "un alumno cursa VARIAS materias" (tabla Inscripciones).
    // EF genera esta migración quitando la columna primero; acá se reordenó a mano para no perder datos:
    //   1) crear la tabla  2) copiar cada asignación existente como una inscripción activa
    //   3) verificar que todas se copiaron (si no, aborta y se revierte todo)  4) recién ahí quitar Alumnos.MateriaId.
    public partial class AddInscripciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Inscripciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AlumnoId = table.Column<int>(type: "int", nullable: false),
                    MateriaId = table.Column<int>(type: "int", nullable: false),
                    FechaAltaUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaBajaUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Inscripciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Inscripciones_Alumnos_AlumnoId",
                        column: x => x.AlumnoId,
                        principalTable: "Alumnos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Inscripciones_Materias_MateriaId",
                        column: x => x.MateriaId,
                        principalTable: "Materias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Inscripciones_MateriaId",
                table: "Inscripciones",
                column: "MateriaId");

            migrationBuilder.CreateIndex(
                name: "UX_Inscripciones_AlumnoId_MateriaId_Activa",
                table: "Inscripciones",
                columns: new[] { "AlumnoId", "MateriaId" },
                unique: true,
                filter: "[Estado] = N'Activa'");

            // El modelo anterior no guardaba la fecha de inscripción: las filas heredadas usan la fecha de esta migración.
            migrationBuilder.Sql(@"
INSERT INTO [Inscripciones] ([AlumnoId], [MateriaId], [FechaAltaUtc], [FechaBajaUtc], [Estado])
SELECT [Id], [MateriaId], SYSUTCDATETIME(), NULL, N'Activa'
FROM [Alumnos];");

            // Verificación: cada asignación original tiene su inscripción activa equivalente y no sobra ninguna.
            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1 FROM [Alumnos] a
    WHERE NOT EXISTS (
        SELECT 1 FROM [Inscripciones] i
        WHERE i.[AlumnoId] = a.[Id] AND i.[MateriaId] = a.[MateriaId] AND i.[Estado] = N'Activa'))
    THROW 50001, N'Migración abortada: hay alumnos cuya materia no tiene su inscripción equivalente.', 1;

IF (SELECT COUNT(*) FROM [Inscripciones]) <> (SELECT COUNT(*) FROM [Alumnos])
    THROW 50002, N'Migración abortada: la cantidad de inscripciones no coincide con la de alumnos.', 1;");

            migrationBuilder.DropForeignKey(
                name: "FK_Alumnos_Materias_MateriaId",
                table: "Alumnos");

            migrationBuilder.DropIndex(
                name: "IX_Alumnos_MateriaId",
                table: "Alumnos");

            migrationBuilder.DropColumn(
                name: "MateriaId",
                table: "Alumnos");
        }

        /// <inheritdoc />
        // Vuelve al modelo anterior (una sola materia por alumno). Ese modelo no puede representar varias materias ni
        // el historial de bajas, así que la reversión SOLO se hace si no se pierde nada: cada alumno tiene exactamente
        // una inscripción y está activa (es el caso de una base recién migrada). En cualquier otro caso se aborta antes
        // de tocar la base, con un mensaje que explica qué hacer; no se descarta información en silencio.
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM [Inscripciones] GROUP BY [AlumnoId] HAVING COUNT(*) > 1)
    THROW 50004, N'No se puede revertir sin perder información: hay alumnos con más de una inscripción y el modelo anterior admite una sola materia por alumno. Eliminá a mano las inscripciones que sobren si querés revertir igual.', 1;

IF EXISTS (SELECT 1 FROM [Inscripciones] WHERE [Estado] <> N'Activa')
    THROW 50005, N'No se puede revertir sin perder historial: hay inscripciones de baja y el modelo anterior no las representa. Eliminalas a mano si querés revertir igual.', 1;");

            migrationBuilder.AddColumn<int>(
                name: "MateriaId",
                table: "Alumnos",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE a SET a.[MateriaId] = (
    SELECT TOP (1) i.[MateriaId]
    FROM [Inscripciones] i
    WHERE i.[AlumnoId] = a.[Id]
    ORDER BY CASE WHEN i.[Estado] = N'Activa' THEN 0 ELSE 1 END, i.[FechaAltaUtc] DESC, i.[Id] DESC)
FROM [Alumnos] a;");

            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM [Alumnos] WHERE [MateriaId] IS NULL)
    THROW 50003, N'No se puede revertir: hay alumnos sin ninguna inscripción y el modelo anterior exige una materia por alumno.', 1;");

            migrationBuilder.AlterColumn<int>(
                name: "MateriaId",
                table: "Alumnos",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Alumnos_MateriaId",
                table: "Alumnos",
                column: "MateriaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Alumnos_Materias_MateriaId",
                table: "Alumnos",
                column: "MateriaId",
                principalTable: "Materias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.DropTable(
                name: "Inscripciones");
        }
    }
}
