import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';
import Swal, { SweetAlertResult } from 'sweetalert2';

import { DialogAgregarInscripcion } from './dialog-agregar-inscripcion';
import { environment } from '../../environments/environment';

describe('DialogAgregarInscripcion', () => {
  let fixture: ComponentFixture<DialogAgregarInscripcion>;
  let component: DialogAgregarInscripcion;
  let httpMock: HttpTestingController;
  let dialogRef: { close: jasmine.Spy };

  const ana = { id: 10, nombre: 'Ana Pérez', email: 'ana@mail.com' };
  const programacion = { id: 2, nombre: 'Programación' };

  const botonInscribir = () => (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]') as HTMLButtonElement;

  beforeEach(async () => {
    dialogRef = { close: jasmine.createSpy('close') };

    await TestBed.configureTestingModule({
      imports: [DialogAgregarInscripcion],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DialogAgregarInscripcion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not allow enrolling until an alumno and a materia are picked from the lists', () => {
    expect(botonInscribir().disabled).toBeTrue();

    // Texto suelto no alcanza: hay que elegir una opción.
    component.form.setValue({ alumno: 'Ana', materia: 'Prog' });
    fixture.detectChanges();
    expect(botonInscribir().disabled).toBeTrue();

    component.form.setValue({ alumno: ana, materia: null });
    fixture.detectChanges();
    expect(botonInscribir().disabled).toBeTrue();

    component.form.setValue({ alumno: ana, materia: programacion });
    fixture.detectChanges();
    expect(botonInscribir().disabled).toBeFalse();
  });

  it('should POST the ids of the picked alumno and materia and close with true', () => {
    component.form.setValue({ alumno: ana, materia: programacion });

    component.confirmar();

    const req = httpMock.expectOne(`${environment.apiUrl}/inscripciones`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ alumnoId: 10, materiaId: 2 });
    req.flush({ id: 1 }, { status: 201, statusText: 'Created' });

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should not call the API when only free text was typed', () => {
    component.form.setValue({ alumno: 'Ana', materia: 'Prog' });

    component.confirmar();

    httpMock.expectNone(`${environment.apiUrl}/inscripciones`);
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.form.controls.alumno.hasError('seleccion')).toBeTrue();
  });

  it('should show the reason of a 409 (already enrolled) and keep the dialog open', () => {
    const swal = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));
    component.form.setValue({ alumno: ana, materia: programacion });

    component.confirmar();

    const detalle = 'Ana Pérez ya tiene una inscripción activa en Programación.';
    httpMock.expectOne(`${environment.apiUrl}/inscripciones`)
      .flush({ title: 'Conflicto', detail: detalle }, { status: 409, statusText: 'Conflict' });

    expect(swal).toHaveBeenCalledWith('No se pudo inscribir', detalle, 'error');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.guardando).toBeFalse();
  });

  it('should search the alumnos and materias lists of the API', () => {
    component.buscarAlumnos('ana').subscribe();
    component.buscarMaterias('prog').subscribe();

    const alumnos = httpMock.expectOne(r => r.url === `${environment.apiUrl}/Alumno`);
    expect(alumnos.request.params.get('search')).toBe('ana');
    expect(String(alumnos.request.params.get('pageSize'))).toBe('20');
    alumnos.flush({ items: [], totalCount: 0, page: 1, pageSize: 20 });

    const materias = httpMock.expectOne(r => r.url === `${environment.apiUrl}/Materia`);
    expect(materias.request.params.get('search')).toBe('prog');
    materias.flush({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  });
});
