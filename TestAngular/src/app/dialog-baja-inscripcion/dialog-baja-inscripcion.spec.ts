import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal, { SweetAlertResult } from 'sweetalert2';

import { DialogBajaInscripcion } from './dialog-baja-inscripcion';
import { Inscripcion } from '../interfaces/Inscripcion';
import { environment } from '../../environments/environment';

describe('DialogBajaInscripcion', () => {
  let fixture: ComponentFixture<DialogBajaInscripcion>;
  let component: DialogBajaInscripcion;
  let httpMock: HttpTestingController;
  let dialogRef: { close: jasmine.Spy };

  const inscripcion: Inscripcion = {
    id: 7, alumnoId: 10, alumnoNombre: 'Ana Pérez', materiaId: 2, materiaNombre: 'Programación',
    estado: 'Activa', fechaAltaUtc: '2026-11-17T15:00:00Z', fechaBajaUtc: null
  };

  const boton = (texto: string) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(b => b.textContent?.includes(texto)) as HTMLButtonElement;

  beforeEach(async () => {
    dialogRef = { close: jasmine.createSpy('close') };

    await TestBed.configureTestingModule({
      imports: [DialogBajaInscripcion],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { inscripcion } },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DialogBajaInscripcion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should name the alumno and the materia in the confirmation', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent;

    expect(texto).toContain('Ana Pérez');
    expect(texto).toContain('Programación');
  });

  it('should PATCH the baja and close with true after confirming', () => {
    boton('Dar de baja').click();

    const req = httpMock.expectOne(`${environment.apiUrl}/inscripciones/7/baja`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close without a value and without calling the API when cancelled', () => {
    boton('Cancelar').click();

    expect(dialogRef.close).toHaveBeenCalledWith();
    httpMock.expectNone(`${environment.apiUrl}/inscripciones/7/baja`);
  });

  it('should show the API message and stay open when the baja fails', () => {
    const swal = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));

    component.confirmar();

    httpMock.expectOne(`${environment.apiUrl}/inscripciones/7/baja`)
      .flush({ detail: 'No existe la inscripción con id 7.' }, { status: 404, statusText: 'Not Found' });

    expect(swal).toHaveBeenCalledWith('No se pudo dar de baja', 'No existe la inscripción con id 7.', 'error');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.guardando).toBeFalse();
  });
});
