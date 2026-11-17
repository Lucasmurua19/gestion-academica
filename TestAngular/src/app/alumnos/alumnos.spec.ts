import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import Swal, { SweetAlertResult } from 'sweetalert2';

import { AlumnosComponent } from './alumnos';
import { Alumno } from '../interfaces/Alumno';
import { PagedResult } from '../interfaces/Paginacion';
import { environment } from '../../environments/environment';

describe('AlumnosComponent', () => {
  let fixture: ComponentFixture<AlumnosComponent>;
  let component: AlumnosComponent;
  let httpMock: HttpTestingController;

  const alumno = (id: number): Alumno => ({ id, nombre: `Alumno ${id}`, email: `alumno${id}@mail.com` });
  const pagina = (items: Alumno[], totalCount: number): PagedResult<Alumno> => ({ items, totalCount, page: 1, pageSize: 10 });

  const iniciarSesion = (rol: string) => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('usuario', JSON.stringify({ id: 1, nombre: 'Usuario', email: 'u@mail.com', rol, token: 'abc' }));
  };

  const listado = () => httpMock.expectOne(r => r.url === `${environment.apiUrl}/Alumno`);

  function crear(rol: string) {
    iniciarSesion(rol);

    fixture = TestBed.createComponent(AlumnosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const hayBoton = (texto: string) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).some(b => b.textContent?.includes(texto));

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AlumnosComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should ask for the first page on init and render the rows', () => {
    crear('Admin');

    const req = listado();
    expect(String(req.request.params.get('page'))).toBe('1');
    expect(String(req.request.params.get('pageSize'))).toBe('10');
    req.flush(pagina([alumno(1), alumno(2)], 12));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('tr[mat-row]').length).toBe(2);
    expect(component.totalCount).toBe(12);
  });

  it('should only show personal data (the materias are managed from Inscripciones)', () => {
    crear('Admin');
    listado().flush(pagina([alumno(1)], 1));
    fixture.detectChanges();

    expect(component.displayedColumns).toEqual(['id', 'nombre', 'email', 'acciones']);
    expect((fixture.nativeElement as HTMLElement).querySelector('.barra mat-select')).toBeNull();
  });

  it('should ask the server for the page the paginator selects', () => {
    crear('Admin');
    listado().flush(pagina([alumno(1)], 30));

    component.onPage({ pageIndex: 1, pageSize: 5, length: 30 });

    const req = listado();
    expect(String(req.request.params.get('page'))).toBe('2');
    expect(String(req.request.params.get('pageSize'))).toBe('5');
    req.flush(pagina([alumno(6)], 30));
  });

  it('should wait 300 ms before searching and go back to page 1', fakeAsync(() => {
    crear('Admin');
    listado().flush(pagina([alumno(1)], 30));

    component.onPage({ pageIndex: 1, pageSize: 10, length: 30 });
    listado().flush(pagina([alumno(11)], 30));

    component.busqueda.setValue('ana');
    tick(299);
    httpMock.expectNone(r => r.url === `${environment.apiUrl}/Alumno`);

    tick(1);
    const req = listado();
    expect(req.request.params.get('search')).toBe('ana');
    expect(String(req.request.params.get('page'))).toBe('1');
    req.flush(pagina([], 0));
  }));

  it('should go back one page when the last page is left empty', () => {
    crear('Admin');
    listado().flush(pagina([alumno(1)], 11));

    component.onPage({ pageIndex: 1, pageSize: 10, length: 11 });
    // Se borró el único alumno de la página 2: quedan 10, o sea una sola página.
    listado().flush(pagina([], 10));

    const req = listado();
    expect(String(req.request.params.get('page'))).toBe('1');
    req.flush(pagina([alumno(1)], 10));
  });

  it('should show the empty state when there are no results', () => {
    crear('Admin');
    listado().flush(pagina([], 0));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se encontraron alumnos.');
  });

  it('should show the reason the API gives when an alumno with inscripciones cannot be deleted (409)', fakeAsync(() => {
    const swal = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));

    crear('Admin');
    listado().flush(pagina([alumno(1)], 1));

    component.eliminar(alumno(1));
    flushMicrotasks();

    const detalle = 'No se puede eliminar al alumno "Alumno 1" porque tiene 2 inscripciones registradas. El historial de inscripciones se conserva.';
    httpMock.expectOne(r => r.method === 'DELETE' && r.url === `${environment.apiUrl}/Alumno/1`)
      .flush({ detail: detalle }, { status: 409, statusText: 'Conflict' });

    expect(swal).toHaveBeenCalledWith('No se pudo eliminar', detalle, 'error');
    // No se recarga la tabla: el alumno sigue ahí.
    httpMock.expectNone(r => r.url === `${environment.apiUrl}/Alumno` && r.method === 'GET');
  }));

  it('should delete an alumno without inscripciones and refresh the table', fakeAsync(() => {
    const swal = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));

    crear('Admin');
    listado().flush(pagina([alumno(1), alumno(2)], 2));

    component.eliminar(alumno(2));
    flushMicrotasks();

    httpMock.expectOne(r => r.method === 'DELETE' && r.url === `${environment.apiUrl}/Alumno/2`)
      .flush(null, { status: 204, statusText: 'No Content' });

    expect(swal).toHaveBeenCalledWith('Eliminado', 'El alumno fue eliminado.', 'success');
    listado().flush(pagina([alumno(1)], 1));
    expect(component.alumnos.length).toBe(1);
  }));

  it('should show the actions only to an admin', () => {
    crear('Admin');
    listado().flush(pagina([alumno(1)], 1));
    fixture.detectChanges();

    expect(component.displayedColumns).toContain('acciones');
    expect(hayBoton('Nuevo alumno')).toBeTrue();
    expect(hayBoton('Editar')).toBeTrue();
    expect(hayBoton('Eliminar')).toBeTrue();
  });

  it('should hide the actions from a read-only user', () => {
    crear('Consulta');
    listado().flush(pagina([alumno(1)], 1));
    fixture.detectChanges();

    expect(component.displayedColumns).not.toContain('acciones');
    expect(hayBoton('Nuevo alumno')).toBeFalse();
    expect(hayBoton('Editar')).toBeFalse();
    expect(hayBoton('Eliminar')).toBeFalse();
  });
});
