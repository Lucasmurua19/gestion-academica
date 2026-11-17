import { EstadoInscripcion } from './Inscripcion';

// Respuesta de los listados paginados de la API: { items, totalCount, page, pageSize }
export interface PagedResult<T> {

    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;

}

// Parámetros de los listados: page empieza en 1.
export interface FiltroAlumnos {

    page: number;
    pageSize: number;
    search?: string;

}

export interface FiltroMaterias {

    page: number;
    pageSize: number;
    search?: string;

}

export interface FiltroInscripciones {

    page: number;
    pageSize: number;
    alumnoId?: number | null;
    materiaId?: number | null;
    estado?: EstadoInscripcion | null;

}
