import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';
import { ApiProblem } from '../interfaces/ApiProblem';

// Lo que devuelve la API ante un error es un ProblemDetails (ver interfaces/ApiProblem.ts).
export function problemaDe(err: unknown): ApiProblem | null {

  if (err instanceof HttpErrorResponse && err.error && typeof err.error === 'object') {
    return err.error as ApiProblem;
  }

  return null;

}

// 401 y 403 ya los atiende el interceptor (vuelve al login o avisa que falta el permiso).
export function esErrorDeSesion(err: unknown): boolean {

  return err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403);

}

// { "MateriaId": ["..."] } -> { materiaId: "..." } (primer mensaje de cada campo, con la clave en camelCase como los formularios)
export function erroresPorCampo(err: unknown): Record<string, string> {

  const resultado: Record<string, string> = {};
  const errores = problemaDe(err)?.errors;

  if (!errores) return resultado;

  for (const [campo, mensajes] of Object.entries(errores)) {
    if (mensajes?.length) {
      resultado[campo.charAt(0).toLowerCase() + campo.slice(1)] = mensajes[0];
    }
  }

  return resultado;

}

// Texto listo para mostrarle al usuario.
export function mensajeDeError(err: unknown, porDefecto: string): string {

  if (err instanceof HttpErrorResponse && err.status === 0) {
    return 'No se pudo conectar con el servidor.';
  }

  const problema = problemaDe(err);
  if (!problema) return porDefecto;

  const mensajesPorCampo = Object.values(erroresPorCampo(err));

  let mensaje = mensajesPorCampo.length ? mensajesPorCampo.join(' ') : (problema.detail ?? porDefecto);

  // En las fallas inesperadas el servidor no da detalles, solo el identificador para buscarlo en su log.
  if (err instanceof HttpErrorResponse && err.status >= 500 && problema.traceId) {
    mensaje += ` (código de seguimiento: ${problema.traceId})`;
  }

  return mensaje;

}

// Los errores de campo que devuelve la API (400) se muestran debajo de cada input. Devuelve true si aplicó alguno.
export function aplicarErroresDeCampo(form: FormGroup, err: unknown): boolean {

  let aplicado = false;

  for (const [campo, mensaje] of Object.entries(erroresPorCampo(err))) {
    const control = form.get(campo);

    if (control) {
      control.setErrors({ servidor: mensaje });
      control.markAsTouched();
      aplicado = true;
    }
  }

  return aplicado;

}

// Mensaje del <mat-error> de un campo: primero el que mandó el servidor, si no el del validador local.
export function mensajeDeControl(control: AbstractControl | null): string {

  const errores = control?.errors;
  if (!errores) return '';

  if (errores['servidor']) return errores['servidor'];
  if (errores['seleccion']) return 'Elegí una opción de la lista.';
  if (errores['required']) return 'Este campo es obligatorio.';
  if (errores['email']) return 'El email no tiene un formato válido.';
  if (errores['minlength']) return `Mínimo ${errores['minlength'].requiredLength} caracteres.`;
  if (errores['maxlength']) return `Máximo ${errores['maxlength'].requiredLength} caracteres.`;

  return 'Valor no válido.';

}

export function mostrarError(titulo: string, err: unknown, porDefecto: string): void {

  if (esErrorDeSesion(err)) return;

  Swal.fire(titulo, mensajeDeError(err, porDefecto), 'error');

}
