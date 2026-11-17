import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth-service';
import { problemaDe } from '../utils/api-error';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const reqFinal = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(reqFinal).pipe(
    catchError((err: HttpErrorResponse) => {

      // Un 401 en /Auth/login es "clave incorrecta": lo muestra el propio formulario, no es una sesión vencida.
      const esLlamadaDeAuth = req.url.includes('/Auth/');

      if (err.status === 401 && !esLlamadaDeAuth) {

        authService.logout();
        router.navigate(['/login']);
        Swal.fire('Sesión no válida', 'Tu sesión venció o no es válida. Iniciá sesión de nuevo.', 'info');

      } else if (err.status === 403) {

        const detalle = problemaDe(err)?.detail ?? 'No tenés permisos para realizar esta acción.';
        Swal.fire('Sin permisos', detalle, 'warning');

      }

      return throwError(() => err);

    })
  );

};
