import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { Header } from './header';
import { AuthService } from '../services/auth-service';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show the login and register links when there is no session', () => {
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent;

    expect(texto).toContain('Iniciar sesión');
    expect(texto).toContain('Registrarse');
    expect(texto).not.toContain('Cerrar sesión');
  });

  it('should show the user name, the role and the logout link when logged in', () => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('usuario', JSON.stringify({ id: 1, nombre: 'Ana', email: 'ana@mail.com', rol: 'Admin', token: 'abc' }));

    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent;

    expect(texto).toContain('Ana (Admin)');
    expect(texto).toContain('Cerrar sesión');
    expect(texto).not.toContain('Iniciar sesión');
  });

  it('should clear the session and go to /login on logout', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    localStorage.setItem('token', 'abc');

    component.logout();

    expect(TestBed.inject(AuthService).estaLogueado()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
