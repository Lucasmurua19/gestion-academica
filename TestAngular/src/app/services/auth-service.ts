import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginDto, RegistroDto } from '../interfaces/Auth';

const TOKEN_KEY = 'token';
const USUARIO_KEY = 'usuario';

export const ROL_ADMIN = 'Admin';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private ApiUrl: string = `${environment.apiUrl}/Auth`;

  constructor(

    private http: HttpClient

  ) { }


  registro(dto: RegistroDto): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(`${this.ApiUrl}/registro`, dto)
      .pipe(tap(res => this.guardarSesion(res)));

  }

  login(dto: LoginDto): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(`${this.ApiUrl}/login`, dto)
      .pipe(tap(res => this.guardarSesion(res)));

  }

  logout(): void {

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);

  }

  getToken(): string | null {

    return localStorage.getItem(TOKEN_KEY);

  }

  estaLogueado(): boolean {

    return !!this.getToken();

  }

  // Datos del usuario que se guardaron al iniciar sesión (nombre, email, rol).
  getUsuario(): AuthResponse | null {

    const guardado = localStorage.getItem(USUARIO_KEY);
    if (!guardado) return null;

    try {
      return JSON.parse(guardado) as AuthResponse;
    } catch {
      return null;
    }

  }

  // Solo sirve para mostrar u ocultar botones: quien realmente autoriza cada acción es la API.
  esAdmin(): boolean {

    return this.estaLogueado() && this.getUsuario()?.rol === ROL_ADMIN;

  }

  private guardarSesion(res: AuthResponse): void {

    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(res));

  }

}
