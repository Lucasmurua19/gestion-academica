export interface RegistroDto {

    nombre: string;
    email: string;
    password: string;

}

export interface LoginDto {

    email: string;
    password: string;

}

export interface AuthResponse {

    id: number;
    nombre: string;
    email: string;
    rol: string;
    token: string;

}
