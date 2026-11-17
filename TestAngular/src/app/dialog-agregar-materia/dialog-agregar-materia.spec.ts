import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DialogAgregarMateria } from './dialog-agregar-materia';
import { Materias } from '../interfaces/Materias';
import { environment } from '../../environments/environment';

describe('DialogAgregarMateria', () => {
  let fixture: ComponentFixture<DialogAgregarMateria>;
  let component: DialogAgregarMateria;
  let httpMock: HttpTestingController;
  let dialogRef: { close: jasmine.Spy };

  const materia: Materias = { id: 3, nombre: 'Base de Datos' };

  function crear(data: { materia?: Materias }) {
    TestBed.configureTestingModule({
      imports: [DialogAgregarMateria],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DialogAgregarMateria);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const botonGuardar = () => (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]') as HTMLButtonElement;

  beforeEach(() => {
    dialogRef = { close: jasmine.createSpy('close') };
  });

  afterEach(() => httpMock.verify());

  it('should preload the current name when editing, so Guardar is enabled', () => {
    crear({ materia });

    expect(component.form.getRawValue().nombre).toBe('Base de Datos');
    expect(botonGuardar().disabled).toBeFalse();
    expect(botonGuardar().textContent).toContain('Guardar');
  });

  it('should not allow saving an empty new materia', () => {
    crear({});

    expect(botonGuardar().disabled).toBeTrue();
    expect(botonGuardar().textContent).toContain('Agregar');
  });

  it('should PUT the edited materia and close with true', () => {
    crear({ materia });
    component.form.setValue({ nombre: 'Bases de Datos' });

    component.confirmar();

    const req = httpMock.expectOne(`${environment.apiUrl}/Materia/3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nombre: 'Bases de Datos' });
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should POST a new materia and close with true', () => {
    crear({});
    component.form.setValue({ nombre: 'Física' });

    component.confirmar();

    const req = httpMock.expectOne(`${environment.apiUrl}/Materia`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 7, nombre: 'Física' }, { status: 201, statusText: 'Created' });

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should show the API field error under the input and keep the dialog open (400)', () => {
    crear({});
    component.form.setValue({ nombre: 'Física' });

    component.confirmar();

    httpMock.expectOne(`${environment.apiUrl}/Materia`)
      .flush({ errors: { Nombre: ['El nombre debe tener entre 2 y 100 caracteres.'] } }, { status: 400, statusText: 'Bad Request' });

    expect(component.mensaje()).toBe('El nombre debe tener entre 2 y 100 caracteres.');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
