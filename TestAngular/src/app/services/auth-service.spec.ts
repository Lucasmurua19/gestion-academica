import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth-service';
import { environment } from '../../environments/environment';
import { AuthResponse } from '../interfaces/Auth';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const respuesta = (rol: string): AuthResponse => ({ id: 1, nombre: 'Ana', email: 'ana@mail.com', rol, token: 'jwt-de-prueba' });

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => localStorage.clear());

  it('should store the token and the user (with role) after logging in', () => {
    service.login({ email: 'ana@mail.com', password: 'secreta1' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/Auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(respuesta('Consulta'));

    expect(service.estaLogueado()).toBeTrue();
    expect(service.getToken()).toBe('jwt-de-prueba');
    expect(service.getUsuario()?.rol).toBe('Consulta');
  });

  it('should store the session after registering', () => {
    service.registro({ nombre: 'Ana', email: 'ana@mail.com', password: 'secreta1' }).subscribe();

    httpMock.expectOne(`${environment.apiUrl}/Auth/registro`).flush(respuesta('Consulta'));

    expect(service.estaLogueado()).toBeTrue();
  });

  it('should only be admin when the stored role is Admin', () => {
    service.login({ email: 'a@a.com', password: 'x' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/Auth/login`).flush(respuesta('Admin'));
    expect(service.esAdmin()).toBeTrue();

    service.login({ email: 'a@a.com', password: 'x' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/Auth/login`).flush(respuesta('Consulta'));
    expect(service.esAdmin()).toBeFalse();
  });

  it('should not be admin without a session even if a stale user is stored', () => {
    localStorage.setItem('usuario', JSON.stringify(respuesta('Admin')));

    expect(service.esAdmin()).toBeFalse();
  });

  it('should clear the session on logout', () => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('usuario', JSON.stringify(respuesta('Admin')));

    service.logout();

    expect(service.estaLogueado()).toBeFalse();
    expect(service.getUsuario()).toBeNull();
  });

  it('should ignore a corrupt stored user', () => {
    localStorage.setItem('usuario', '{no-es-json');

    expect(service.getUsuario()).toBeNull();
  });
});
