import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { DashboardC } from './dashboard-c';
import { ResumenAcademico } from '../interfaces/Dashboard';
import { environment } from '../../environments/environment';

describe('DashboardC (Dashboard Académico)', () => {
  let component: DashboardC;
  let fixture: ComponentFixture<DashboardC>;
  let httpMock: HttpTestingController;

  const general: ResumenAcademico = {
    totalAlumnosRegistrados: 2, totalMateriasRegistradas: 3, totalInscripcionesActivas: 3, alumnosInscriptosActivos: 2,
    inscripcionesPorMateria: [
      { materiaId: 1, nombre: 'Algebra', cantidadActivas: 1 },
      { materiaId: 2, nombre: 'Biologia', cantidadActivas: 2 },
      { materiaId: 3, nombre: 'Quimica', cantidadActivas: 0 }
    ]
  };

  const biologia: ResumenAcademico = {
    totalAlumnosRegistrados: 2, totalMateriasRegistradas: 3, totalInscripcionesActivas: 2, alumnosInscriptosActivos: 2,
    inscripcionesPorMateria: [{ materiaId: 2, nombre: 'Biologia', cantidadActivas: 2 }]
  };

  const quimica: ResumenAcademico = {
    totalAlumnosRegistrados: 2, totalMateriasRegistradas: 3, totalInscripcionesActivas: 0, alumnosInscriptosActivos: 0,
    inscripcionesPorMateria: [{ materiaId: 3, nombre: 'Quimica', cantidadActivas: 0 }]
  };

  const resumen = () => httpMock.expectOne(r => r.url === `${environment.apiUrl}/dashboard-academico`);
  const tarjeta = (id: string) => ((fixture.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLElement).textContent ?? '';
  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const filas = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tr[mat-row]')).map(f => (f.textContent ?? '').replace(/\s+/g, ' ').trim());

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [DashboardC],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DashboardC);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/Materia/todas`).flush([
      { id: 1, nombre: 'Algebra' }, { id: 2, nombre: 'Biologia' }, { id: 3, nombre: 'Quimica' }
    ]);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should show the loading bar until the summary arrives', () => {
    expect(component.cargando).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).querySelector('mat-progress-bar')).toBeTruthy();

    resumen().flush(general);
    fixture.detectChanges();

    expect(component.cargando).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).querySelector('mat-progress-bar')).toBeNull();
  });

  it('should ask for the general summary and show the three indicators', () => {
    const req = resumen();
    expect(req.request.params.has('materiaId')).toBeFalse();
    req.flush(general);
    fixture.detectChanges();

    expect(tarjeta('tarjeta-alumnos')).toContain('Alumnos registrados');
    expect(tarjeta('tarjeta-alumnos')).toContain('2');
    expect(tarjeta('tarjeta-materias')).toContain('Materias registradas');
    expect(tarjeta('tarjeta-materias')).toContain('3');
    expect(tarjeta('tarjeta-materias')).toContain('no cambia con el filtro');
    expect(tarjeta('tarjeta-inscripciones')).toContain('Inscripciones activas');
    expect(tarjeta('tarjeta-inscripciones')).toContain('3');
    expect(tarjeta('tarjeta-inscripciones')).toContain('En todas las materias');
  });

  it('should list every materia in the detail, keeping the ones with zero', () => {
    resumen().flush(general);
    fixture.detectChanges();

    expect(filas()).toEqual(['Algebra 1', 'Biologia 2', 'Quimica 0']);
  });

  it('should ask for the selected materia and relabel the alumnos card once the answer arrives', () => {
    resumen().flush(general);
    fixture.detectChanges();

    component.materiaFiltro.setValue(2);

    const req = resumen();
    expect(String(req.request.params.get('materiaId'))).toBe('2');

    // Mientras carga, la tarjeta sigue diciendo lo que corresponde a los números que muestra (los de antes).
    fixture.detectChanges();
    expect(tarjeta('tarjeta-alumnos')).toContain('Alumnos registrados');

    req.flush(biologia);
    fixture.detectChanges();

    expect(tarjeta('tarjeta-alumnos')).toContain('Alumnos inscriptos en la materia');
    expect(tarjeta('tarjeta-alumnos')).not.toContain('Alumnos registrados');
    expect(tarjeta('tarjeta-inscripciones')).toContain('En Biologia');
    expect(tarjeta('tarjeta-materias')).toContain('3');
    expect(filas()).toEqual(['Biologia 2']);
  });

  it('should keep the zero when the materia exists but has no active enrollments', () => {
    resumen().flush(general);
    component.materiaFiltro.setValue(3);

    resumen().flush(quimica);
    fixture.detectChanges();

    expect(tarjeta('tarjeta-alumnos')).toContain('Alumnos inscriptos en la materia');
    expect(tarjeta('tarjeta-alumnos')).toContain('0');
    expect(tarjeta('tarjeta-inscripciones')).toContain('0');
    expect(filas()).toEqual(['Quimica 0']);
  });

  it('should go back to the registered-alumnos label when "Todas las materias" is chosen again', () => {
    resumen().flush(general);
    component.materiaFiltro.setValue(2);
    resumen().flush(biologia);
    fixture.detectChanges();

    component.materiaFiltro.setValue(null);
    const req = resumen();
    expect(req.request.params.has('materiaId')).toBeFalse();
    req.flush(general);
    fixture.detectChanges();

    expect(tarjeta('tarjeta-alumnos')).toContain('Alumnos registrados');
    expect(filas().length).toBe(3);
  });

  it('should show the error and a retry button when the summary cannot be loaded', () => {
    spyOn(console, 'error');
    resumen().flush({ title: 'Recurso no encontrado', detail: 'No existe la materia con id 9.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(component.error).toBe('No existe la materia con id 9.');
    expect(texto()).toContain('No existe la materia con id 9.');
    expect((fixture.nativeElement as HTMLElement).querySelector('.tarjetas')).toBeNull();

    const reintentar = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(b => b.textContent?.includes('Reintentar')) as HTMLButtonElement;
    reintentar.click();

    resumen().flush(general);
    fixture.detectChanges();

    expect(component.error).toBeNull();
    expect(tarjeta('tarjeta-alumnos')).toContain('Alumnos registrados');
  });

  it('should only use the answer of the latest request when the filter changes quickly', () => {
    const primera = resumen();

    component.materiaFiltro.setValue(2);
    const segunda = resumen();

    segunda.flush(biologia);
    fixture.detectChanges();
    expect(component.resumen).toEqual(biologia);

    // La primera respuesta (vieja) ya no tiene a quién entregarse.
    expect(primera.cancelled).toBeTrue();
  });
});
