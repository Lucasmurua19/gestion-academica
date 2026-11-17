export type EstadoInscripcion = 'Activa' | 'Baja';

export interface Inscripcion {

    id: number;
    alumnoId: number;
    alumnoNombre: string;
    materiaId: number;
    materiaNombre: string;
    estado: EstadoInscripcion;
    fechaAltaUtc: string;
    fechaBajaUtc: string | null;

}

export interface CrearInscripcionDto {

    alumnoId: number;
    materiaId: number;

}
