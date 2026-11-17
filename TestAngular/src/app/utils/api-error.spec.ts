import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import Swal, { SweetAlertResult } from 'sweetalert2';

import {
  aplicarErroresDeCampo,
  erroresPorCampo,
  esErrorDeSesion,
  mensajeDeControl,
  mensajeDeError,
  mostrarError
} from './api-error';

const http = (status: number, error: unknown) => new HttpErrorResponse({ status, error });

describe('api-error', () => {

  describe('erroresPorCampo', () => {

    it('should take the first message of each field and use camelCase keys', () => {
      const err = http(400, { errors: { MateriaId: ['La materia indicada no existe.'], Nombre: ['El nombre es obligatorio.', 'Muy corto.'] } });

      expect(erroresPorCampo(err)).toEqual({
        materiaId: 'La materia indicada no existe.',
        nombre: 'El nombre es obligatorio.'
      });
    });

    it('should return nothing when the error has no field errors', () => {
      expect(erroresPorCampo(http(409, { detail: 'Conflicto' }))).toEqual({});
      expect(erroresPorCampo(new Error('x'))).toEqual({});
    });

  });

  describe('mensajeDeError', () => {

    it('should use the detail sent by the API', () => {
      expect(mensajeDeError(http(409, { detail: 'La materia tiene alumnos.' }), 'por defecto')).toBe('La materia tiene alumnos.');
    });

    it('should join the field messages of a validation error', () => {
      const err = http(400, { detail: 'Uno o más campos no son válidos.', errors: { Email: ['Email inválido.'], Password: ['Muy corta.'] } });

      expect(mensajeDeError(err, 'por defecto')).toBe('Email inválido. Muy corta.');
    });

    it('should append the trace id on unexpected failures', () => {
      const err = http(500, { detail: 'Ocurrió un error inesperado.', traceId: 'trace-123' });

      expect(mensajeDeError(err, 'por defecto')).toContain('Ocurrió un error inesperado.');
      expect(mensajeDeError(err, 'por defecto')).toContain('trace-123');
    });

    it('should explain when the server cannot be reached', () => {
      expect(mensajeDeError(new HttpErrorResponse({ status: 0 }), 'por defecto')).toBe('No se pudo conectar con el servidor.');
    });

    it('should fall back to the default message', () => {
      expect(mensajeDeError(new Error('x'), 'por defecto')).toBe('por defecto');
    });

  });

  describe('aplicarErroresDeCampo', () => {

    it('should put the server message on the matching control', () => {
      const form = new FormGroup({ materiaId: new FormControl<number | null>(null), nombre: new FormControl('') });

      const aplicado = aplicarErroresDeCampo(form, http(400, { errors: { MateriaId: ['La materia indicada no existe.'] } }));

      expect(aplicado).toBeTrue();
      expect(form.controls.materiaId.errors?.['servidor']).toBe('La materia indicada no existe.');
      expect(form.controls.materiaId.touched).toBeTrue();
      expect(form.controls.nombre.errors).toBeNull();
    });

    it('should report false when no field matches', () => {
      const form = new FormGroup({ nombre: new FormControl('') });

      expect(aplicarErroresDeCampo(form, http(409, { detail: 'x' }))).toBeFalse();
      expect(aplicarErroresDeCampo(form, http(400, { errors: { Otro: ['x'] } }))).toBeFalse();
    });

  });

  describe('mensajeDeControl', () => {

    it('should prefer the server message, then the local validator message', () => {
      const control = new FormControl('', [Validators.required]);
      expect(mensajeDeControl(control)).toBe('Este campo es obligatorio.');

      control.setErrors({ servidor: 'Mensaje del servidor' });
      expect(mensajeDeControl(control)).toBe('Mensaje del servidor');
    });

    it('should ask to pick an option from the list when only free text was typed', () => {
      const control = new FormControl('texto suelto');
      control.setErrors({ seleccion: true });

      expect(mensajeDeControl(control)).toBe('Elegí una opción de la lista.');
    });

    it('should describe email and length errors', () => {
      expect(mensajeDeControl(new FormControl('no-es-mail', [Validators.email]))).toBe('El email no tiene un formato válido.');
      expect(mensajeDeControl(new FormControl('a', [Validators.minLength(2)]))).toBe('Mínimo 2 caracteres.');
      expect(mensajeDeControl(new FormControl('abc', [Validators.maxLength(2)]))).toBe('Máximo 2 caracteres.');
      expect(mensajeDeControl(null)).toBe('');
    });

  });

  describe('mostrarError', () => {

    let swal: jasmine.Spy;

    beforeEach(() => {
      swal = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult));
    });

    it('should show the API message in an alert', () => {
      mostrarError('No se pudo eliminar', http(409, { detail: 'La materia tiene alumnos.' }), 'por defecto');

      expect(swal).toHaveBeenCalledWith('No se pudo eliminar', 'La materia tiene alumnos.', 'error');
    });

    it('should stay silent on 401 and 403 because the interceptor already handles them', () => {
      expect(esErrorDeSesion(http(401, {}))).toBeTrue();
      expect(esErrorDeSesion(http(403, {}))).toBeTrue();
      expect(esErrorDeSesion(http(409, {}))).toBeFalse();

      mostrarError('Error', http(403, {}), 'por defecto');

      expect(swal).not.toHaveBeenCalled();
    });

  });

});
