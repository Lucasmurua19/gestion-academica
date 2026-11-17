import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import Swal, { SweetAlertResult } from 'sweetalert2';

import { Materia } from './materia';
import { Materias } from '../interfaces/Materias';
import { PagedResult } from '../interfaces/Paginacion';
import { environment } from '../../environments/environment';

describe('Materia', () => {
  let fixture: ComponentFixture<Materia>;
  let component: Materia;
  let httpMock: HttpTestingController;

  const materia = (id: number): Materias => ({ id, nombre: `Materia ${id}` });
  const pagina = (items: Materias[], totalCount: number): PagedResult<Materias> => ({ items, totalCount, page: 1, pageSize: 10 });

  const iniciarSesion = (rol: string) => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('usuario', JSON.stringify({ id: 1, nombre: 'Usuario', email: 'u@mail.com', rol, token: 'abc' }));
  };

  const listado = () => httpMock.expectOne(r => r.url === `${environment.apiUrl}/Materia`);

  function crear(rol: string) {
    iniciarSesion(rol);

    fixture = TestBed.createComponent(Materia);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const hayBoton = (texto: string) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).some(b => b.textContent?.includes(texto));

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Materia],
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
    req.flush(pagina([materia(1), materia(2), materia(3)], 3));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('tr[mat-row]').length).toBe(3);
  });

  it('should ask the server for the page the paginator selects', () => {
    crear('Admin');
    listado().flush(pagina([materia(1)], 30));

    component.onPage({ pageIndex: 2, pageSize: 5, length: 30 });

    const req = listado();
    expect(String(req.request.params.get('page'))).toBe('3');
    expect(String(req.request.params.get('pageSize'))).toBe('5');
    req.flush(pagina([materia(11)], 30));
  });

  it('should wait 300 ms before searching and go back to page 1', fakeAsync(() => {
    crear('Admin');
    listado().flush(pagina([materia(1)], 30));

    component.onPage({ pageIndex: 1, pageSize: 10, length: 30 });
    listado().flush(pagina([materia(11)], 30));

    component.busqueda.setValue('mate');
    tick(300);

    const req = listado();
    expect(req.request.params.get('search')).toBe('mate');
    expect(String(req.request.params.get('page'))).toBe('1');
    req.flush(pagina([], 0));
  }));

  it('should show the empty state when there are no results', () => {
    crear('Admin');
    listado().flush(pagina([], 0));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se encontraron materias.');
  });

  it('should show the actions only to an admin', () => {
    crear('Consulta');
    listado().flush(pagina([materia(1)], 1));
    fixture.detectChanges();

    expect(hayBoton('Nueva Materia')).toBeFalse();
    expect(hayBoton('Editar')).toBeFalse();
    expect(hayBoton('Eliminar')).toBeFalse();
  });

  it('should show the reason the API gives when a materia with inscripciones cannot be deleted (409)', fakeAsync(() => {
    const swal = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));

    crear('Admin');
    listado().flush(pagina([materia(1)], 1));

    component.eliminar(materia(1));
    flushMicrotasks();

    const detalle = 'No se puede eliminar la materia "Materia 1" porque tiene 2 inscripciones registradas. El historial de inscripciones se conserva.';
    httpMock.expectOne(r => r.method === 'DELETE' && r.url === `${environment.apiUrl}/Materia/1`)
      .flush({ detail: detalle }, { status: 409, statusText: 'Conflict' });

    expect(swal).toHaveBeenCalledWith('No se pudo eliminar', detalle, 'error');
  }));
});
