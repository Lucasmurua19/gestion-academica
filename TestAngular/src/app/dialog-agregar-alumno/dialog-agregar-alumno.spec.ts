import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { AlumnoDialogComponent } from './dialog-agregar-alumno';
import { Alumno } from '../interfaces/Alumno';
import { environment } from '../../environments/environment';

describe('AlumnoDialogComponent', () => {
  let fixture: ComponentFixture<AlumnoDialogComponent>;
  let component: AlumnoDialogComponent;
  let httpMock: HttpTestingController;
  let dialogRef: { close: jasmine.Spy };

  const alumno: Alumno = { id: 5, nombre: 'Ana Pérez', email: 'ana@mail.com' };

  function crear(data: { alumno?: Alumno }) {
    TestBed.configureTestingModule({
      imports: [AlumnoDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AlumnoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const botonGuardar = () => (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]') as HTMLButtonElement;

  beforeEach(() => {
    dialogRef = { close: jasmine.createSpy('close') };
  });

  afterEach(() => httpMock.verify());

  it('should preload name and email when editing, so Guardar is enabled', () => {
    crear({ alumno });

    expect(component.form.getRawValue()).toEqual({ nombre: 'Ana Pérez', email: 'ana@mail.com' });
    expect(botonGuardar().disabled).toBeFalse();
    expect(botonGuardar().textContent).toContain('Guardar');
  });

  it('should not ask for a materia: that is managed from Inscripciones', () => {
    crear({});

    expect((fixture.nativeElement as HTMLElement).querySelector('mat-select')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Inscripciones');
  });

  it('should not allow saving an empty new student', () => {
    crear({});

    expect(botonGuardar().disabled).toBeTrue();
    expect(botonGuardar().textContent).toContain('Agregar');
  });

  it('should reject an invalid email before calling the API', () => {
    crear({});
    component.form.setValue({ nombre: 'Ana', email: 'no-es-mail' });

    component.confirmar();

    expect(component.form.controls.email.hasError('email')).toBeTrue();
    httpMock.expectNone(`${environment.apiUrl}/Alumno`);
  });

  it('should PUT only the personal data and close with true', () => {
    crear({ alumno });
    component.form.patchValue({ nombre: 'Ana P. Pérez' });

    component.confirmar();

    const req = httpMock.expectOne(`${environment.apiUrl}/Alumno/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nombre: 'Ana P. Pérez', email: 'ana@mail.com' });
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should POST a new student and close with true', () => {
    crear({});
    component.form.setValue({ nombre: 'Beto', email: 'beto@mail.com' });

    component.confirmar();

    const req = httpMock.expectOne(`${environment.apiUrl}/Alumno`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'Beto', email: 'beto@mail.com' });
    req.flush({ id: 9, nombre: 'Beto', email: 'beto@mail.com' }, { status: 201, statusText: 'Created' });

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should show the API field errors under the input and keep the dialog open (400)', () => {
    crear({});
    component.form.setValue({ nombre: 'Beto', email: 'beto@mail.com' });

    component.confirmar();

    httpMock.expectOne(`${environment.apiUrl}/Alumno`)
      .flush({ errors: { Email: ['El email no tiene un formato válido.'] } }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(component.form.controls.email.getError('servidor')).toBe('El email no tiene un formato válido.');
    expect(component.mensaje('email')).toBe('El email no tiene un formato válido.');
    expect(component.guardando).toBeFalse();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
