import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import Swal, { SweetAlertResult } from 'sweetalert2';

import { authInterceptor } from './auth-interceptor';
import { AuthService } from '../services/auth-service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;
  let authService: AuthService;
  let swal: jasmine.Spy;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);

    spyOn(router, 'navigate');
    swal = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));
  });

  afterEach(() => localStorage.clear());

  it('should send the token in the Authorization header', () => {
    localStorage.setItem('token', 'abc');

    http.get('/api/Alumno').subscribe();

    const req = httpMock.expectOne('/api/Alumno');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush({});
  });

  it('should not send the header when there is no session', () => {
    http.get('/api/Alumno').subscribe();

    const req = httpMock.expectOne('/api/Alumno');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should log out, go to /login and warn on a 401 outside /Auth/', () => {
    localStorage.setItem('token', 'abc');

    http.get('/api/Alumno').subscribe({ error: () => {} });
    httpMock.expectOne('/api/Alumno').flush({ title: 'No autenticado' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.estaLogueado()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(swal).toHaveBeenCalled();
  });

  it('should leave a 401 from /Auth/login to the login form (wrong password is not an expired session)', () => {
    http.post('/api/Auth/login', {}).subscribe({ error: () => {} });
    httpMock.expectOne('/api/Auth/login').flush({ detail: 'Email o contraseña incorrectos.' }, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).not.toHaveBeenCalled();
    expect(swal).not.toHaveBeenCalled();
  });

  it('should warn about missing permissions on a 403 without closing the session', () => {
    localStorage.setItem('token', 'abc');

    http.post('/api/Materia', {}).subscribe({ error: () => {} });
    httpMock.expectOne('/api/Materia').flush({ detail: 'No tenés permisos para realizar esta acción.' }, { status: 403, statusText: 'Forbidden' });

    expect(swal).toHaveBeenCalledWith('Sin permisos', 'No tenés permisos para realizar esta acción.', 'warning');
    expect(authService.estaLogueado()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should pass other errors through untouched', () => {
    let status = 0;

    http.get('/api/Alumno').subscribe({ error: (err) => status = err.status });
    httpMock.expectOne('/api/Alumno').flush({ title: 'Error interno del servidor' }, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
    expect(swal).not.toHaveBeenCalled();
  });
});
