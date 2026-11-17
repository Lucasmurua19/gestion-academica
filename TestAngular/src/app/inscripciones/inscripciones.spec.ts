import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import Swal, { SweetAlertResult } from 'sweetalert2';

import { Inscripciones } from './inscripciones';
import { Inscripcion } from '../interfaces/Inscripcion';
import { PagedResult } from '../interfaces/Paginacion';
import { DialogAgregarInscripcion } from '../dialog-agregar-inscripcion/dialog-agregar-inscripcion';
import { DialogBajaInscripcion } from '../dialog-baja-inscripcion/dialog-baja-inscripcion';
import { environment } from '../../environments/environment';

describe('Inscripciones', () => {
  let fixture: ComponentFixture<Inscripciones>;
  let component: Inscripciones;
  let httpMock: HttpTestingController;

  const activa: Inscripcion = {
    id: 1, alumnoId: 10, alumnoNombre: 'Ana Pérez', materiaId: 2, materiaNombre: 'Programación',
    estado: 'Activa', fechaAltaUtc: '2026-11-17T15:00:00Z', fechaBajaUtc: null
  };

  const baja: Inscripcion = {
    id: 2, alumnoId: 10, alumnoNombre: 'Ana Pérez', materiaId: 3, materiaNombre: 'Matemática',
    estado: 'Baja', fechaAltaUtc: '2026-11-10T15:00:00Z', fechaBajaUtc: '2026-11-16T15:00:00Z'
  };

  const pagina = (items: Inscripcion[], totalCount = items.length): PagedResult<Inscripcion> => ({ items, totalCount, page: 1, pageSize: 10 });

  const iniciarSesion = (rol: string) => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('usuario', JSON.stringify({ id: 1, nombre: 'Usuario', email: 'u@mail.com', rol, token: 'abc' }));
  };

  const listado = () => httpMock.expectOne(r => r.url === `${environment.apiUrl}/inscripciones`);

  // Crea el componente y responde el pedido de materias del filtro (el del listado lo responde cada test).
  function crear(rol: string) {
    iniciarSesion(rol);

    fixture = TestBed.createComponent(Inscripciones);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/Materia/todas`).flush([{ id: 2, nombre: 'Programación' }, { id: 3, nombre: 'Matemática' }]);
  }

  // El componente importa MatDialogModule, así que tiene su propia instancia de MatDialog: es esa la que hay que espiar.
  const dialogDelComponente = () => (component as unknown as { dialog: MatDialog }).dialog;

  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const botones = (contiene: string) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).filter(b => b.textContent?.includes(contiene));

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Inscripciones],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should ask for the first page without filters and render names, status and dates', () => {
    crear('Admin');

    const req = listado();
    expect(String(req.request.params.get('page'))).toBe('1');
    expect(String(req.request.params.get('pageSize'))).toBe('10');
    expect(req.request.params.has('alumnoId')).toBeFalse();
    expect(req.request.params.has('materiaId')).toBeFalse();
    expect(req.request.params.has('estado')).toBeFalse();
    req.flush(pagina([activa, baja], 12));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('tr[mat-row]').length).toBe(2);
    expect(texto()).toContain('Ana Pérez');
    expect(texto()).toContain('Programación');
    expect(texto()).toContain('Activa');
    expect(texto()).toContain('Baja');
    expect(texto()).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    expect(component.totalCount).toBe(12);
  });

  it('should show the loading state until the first response arrives', () => {
    crear('Admin');
    fixture.detectChanges();

    expect(component.cargando).toBeTrue();
    expect(texto()).toContain('Cargando inscripciones...');
    expect((fixture.nativeElement as HTMLElement).querySelector('mat-progress-bar')).toBeTruthy();

    listado().flush(pagina([activa]));
    fixture.detectChanges();

    expect(component.cargando).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).querySelector('mat-progress-bar')).toBeNull();
  });

  it('should show the empty state when there are no results', () => {
    crear('Admin');
    listado().flush(pagina([], 0));
    fixture.detectChanges();

    expect(texto()).toContain('No se encontraron inscripciones.');
  });

  it('should show an error with a retry button when the list cannot be loaded', () => {
    spyOn(console, 'error');
    crear('Admin');
    listado().flush({ title: 'Error interno del servidor', detail: 'Ocurrió un error inesperado.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.errorCarga).toContain('Ocurrió un error inesperado.');
    expect(texto()).toContain('Ocurrió un error inesperado.');
    expect(botones('Reintentar').length).toBe(1);

    botones('Reintentar')[0].click();

    listado().flush(pagina([activa]));
    fixture.detectChanges();

    expect(component.errorCarga).toBeNull();
    expect(texto()).toContain('Ana Pérez');
  });

  it('should offer "Dar de baja" only on active enrollments, and only to an admin', () => {
    crear('Admin');
    listado().flush(pagina([activa, baja]));
    fixture.detectChanges();

    expect(botones('Nueva inscripción').length).toBe(1);
    expect(botones('Dar de baja').length).toBe(1);
  });

  it('should hide every write action from a read-only user', () => {
    crear('Consulta');
    listado().flush(pagina([activa, baja]));
    fixture.detectChanges();

    expect(component.displayedColumns).not.toContain('acciones');
    expect(botones('Nueva inscripción').length).toBe(0);
    expect(botones('Dar de baja').length).toBe(0);
  });

  it('should ask the server for the page the paginator selects', () => {
    crear('Admin');
    listado().flush(pagina([activa], 30));

    component.onPage({ pageIndex: 1, pageSize: 5, length: 30 });

    const req = listado();
    expect(String(req.request.params.get('page'))).toBe('2');
    expect(String(req.request.params.get('pageSize'))).toBe('5');
    req.flush(pagina([baja], 30));
  });

  it('should go back to page 1 when the materia filter changes', () => {
    crear('Admin');
    listado().flush(pagina([activa], 30));
    component.onPage({ pageIndex: 2, pageSize: 10, length: 30 });
    listado().flush(pagina([baja], 30));
    expect(component.page).toBe(3);

    component.materiaFiltro.setValue(3);

    const req = listado();
    expect(String(req.request.params.get('page'))).toBe('1');
    expect(String(req.request.params.get('materiaId'))).toBe('3');
    req.flush(pagina([baja], 1));
  });

  it('should go back to page 1 when the status filter changes', () => {
    crear('Admin');
    listado().flush(pagina([activa], 30));
    component.onPage({ pageIndex: 1, pageSize: 10, length: 30 });
    listado().flush(pagina([baja], 30));

    component.estadoFiltro.setValue('Baja');

    const req = listado();
    expect(String(req.request.params.get('page'))).toBe('1');
    expect(req.request.params.get('estado')).toBe('Baja');
    req.flush(pagina([baja], 1));
  });

  it('should filter by alumno only when one is picked from the list, and clear the filter when the text is edited', () => {
    crear('Admin');
    listado().flush(pagina([activa], 30));
    component.onPage({ pageIndex: 1, pageSize: 10, length: 30 });
    listado().flush(pagina([baja], 30));

    // Escribir texto suelto no filtra nada.
    component.alumnoFiltro.setValue('An');
    httpMock.expectNone(r => r.url === `${environment.apiUrl}/inscripciones`);

    // Elegir un alumno de la lista sí, y vuelve a la página 1.
    component.alumnoFiltro.setValue({ id: 10, nombre: 'Ana Pérez', email: 'ana@mail.com' });
    const filtrada = listado();
    expect(String(filtrada.request.params.get('alumnoId'))).toBe('10');
    expect(String(filtrada.request.params.get('page'))).toBe('1');
    filtrada.flush(pagina([activa, baja], 2));

    // Volver a escribir (o borrar) quita el filtro.
    component.alumnoFiltro.setValue('');
    const sinFiltro = listado();
    expect(sinFiltro.request.params.has('alumnoId')).toBeFalse();
    sinFiltro.flush(pagina([activa], 30));
  });

  it('should open the new enrollment dialog and refresh the table after it saves', () => {
    const swal = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));

    crear('Admin');
    listado().flush(pagina([activa]));

    const abrir = spyOn(dialogDelComponente(), 'open').and.returnValue({ afterClosed: () => of(true) } as never);

    component.nuevaInscripcion();

    expect(abrir).toHaveBeenCalledWith(DialogAgregarInscripcion);
    expect(swal).toHaveBeenCalledWith('Listo', 'Inscripción creada correctamente.', 'success');
    listado().flush(pagina([activa, baja]));
  });

  it('should open the drop dialog and refresh the table after confirming', () => {
    const swal = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));

    crear('Admin');
    listado().flush(pagina([activa]));

    const abrir = spyOn(dialogDelComponente(), 'open').and.returnValue({ afterClosed: () => of(true) } as never);

    component.darDeBaja(activa);

    expect(abrir).toHaveBeenCalledWith(DialogBajaInscripcion, { data: { inscripcion: activa } });
    expect(swal).toHaveBeenCalledWith('Listo', 'La inscripción fue dada de baja.', 'success');
    listado().flush(pagina([{ ...activa, estado: 'Baja', fechaBajaUtc: '2026-11-17T16:00:00Z' }]));
  });

  it('should not refresh when the drop dialog is cancelled', () => {
    const swal = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));

    crear('Admin');
    listado().flush(pagina([activa]));

    spyOn(dialogDelComponente(), 'open').and.returnValue({ afterClosed: () => of(undefined) } as never);

    component.darDeBaja(activa);

    expect(swal).not.toHaveBeenCalled();
    httpMock.expectNone(r => r.url === `${environment.apiUrl}/inscripciones`);
  });
});
