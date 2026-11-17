using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CLASE_ORM.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AlumnoMateriaSinCascada : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Alumnos_Materias_MateriaId",
                table: "Alumnos");

            migrationBuilder.AddForeignKey(
                name: "FK_Alumnos_Materias_MateriaId",
                table: "Alumnos",
                column: "MateriaId",
                principalTable: "Materias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Alumnos_Materias_MateriaId",
                table: "Alumnos");

            migrationBuilder.AddForeignKey(
                name: "FK_Alumnos_Materias_MateriaId",
                table: "Alumnos",
                column: "MateriaId",
                principalTable: "Materias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
