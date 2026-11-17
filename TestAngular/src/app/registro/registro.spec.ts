import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { Registro } from './registro';
import { environment } from '../../environments/environment';

describe('Registro', () => {
  let component: Registro;
  let fixture: ComponentFixture<Registro>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Registro);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should show the conflict message when the email is already registered (409)', () => {
    component.nombre = 'Ana';
    component.email = 'ana@mail.com';
    component.password = 'secreta1';

    component.registrarse();

    httpMock.expectOne(`${environment.apiUrl}/Auth/registro`)
      .flush({ title: 'Conflicto', detail: 'El email ya está registrado.' }, { status: 409, statusText: 'Conflict' });

    expect(component.error).toBe('El email ya está registrado.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show the validation messages of each field (400)', () => {
    component.nombre = 'A';
    component.email = 'no-es-mail';
    component.password = '123';

    component.registrarse();

    httpMock.expectOne(`${environment.apiUrl}/Auth/registro`).flush(
      { errors: { Email: ['El email no tiene un formato válido.'], Password: ['La contraseña debe tener entre 6 y 100 caracteres.'] } },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(component.error).toContain('El email no tiene un formato válido.');
    expect(component.error).toContain('La contraseña debe tener entre 6 y 100 caracteres.');
  });

  it('should go to /home after registering', () => {
    component.nombre = 'Ana';
    component.email = 'ana@mail.com';
    component.password = 'secreta1';

    component.registrarse();

    httpMock.expectOne(`${environment.apiUrl}/Auth/registro`)
      .flush({ id: 1, nombre: 'Ana', email: 'ana@mail.com', rol: 'Consulta', token: 'jwt' });

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });
});
