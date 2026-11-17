import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { Login } from './login';
import { environment } from '../../environments/environment';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
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

  it('should show the message the API sends when the credentials are wrong', () => {
    component.email = 'ana@mail.com';
    component.password = 'mala';

    component.ingresar();

    httpMock.expectOne(`${environment.apiUrl}/Auth/login`)
      .flush({ title: 'No autenticado', detail: 'Email o contraseña incorrectos.' }, { status: 401, statusText: 'Unauthorized' });

    expect(component.error).toBe('Email o contraseña incorrectos.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should go to /home after a successful login', () => {
    component.email = 'ana@mail.com';
    component.password = 'secreta1';

    component.ingresar();

    httpMock.expectOne(`${environment.apiUrl}/Auth/login`)
      .flush({ id: 1, nombre: 'Ana', email: 'ana@mail.com', rol: 'Consulta', token: 'jwt' });

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });
});
