export interface InscripcionesPorMateria {

    materiaId: number;
    nombre: string;
    cantidadActivas: number;

}

export interface ResumenAcademico {

    // Totales de registros: no dependen del filtro de materia.
    totalAlumnosRegistrados: number;
    totalMateriasRegistradas: number;

    // Dependen del filtro: con una materia elegida solo cuentan sus inscripciones activas.
    totalInscripcionesActivas: number;
    alumnosInscriptosActivos: number;

    inscripcionesPorMateria: InscripcionesPorMateria[];

}
