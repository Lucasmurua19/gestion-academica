import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable, catchError, debounceTime, distinctUntilChanged, filter, finalize, map, of, startWith, switchMap } from 'rxjs';
import { mensajeDeControl } from '../utils/api-error';

// Validador: el valor tiene que ser una opción elegida de la lista (un objeto), no texto suelto.
export function debeSerSeleccion(control: AbstractControl): ValidationErrors | null {
  return control.value && typeof control.value === 'object' ? null : { seleccion: true };
}

// Campo con autocompletado que busca en el servidor mientras se escribe. Sirve para elegir un alumno o una materia
// cuando hay demasiados registros para un desplegable común. El valor del control es el objeto elegido.
@Component({
  selector: 'app-autocomplete-busqueda',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule],
  template: `
    <mat-form-field appearance="outline" class="campo">

      <mat-label>{{ etiqueta }}</mat-label>

      <input matInput type="text" autocomplete="off" [formControl]="control" [matAutocomplete]="auto" [placeholder]="placeholder">

      <mat-autocomplete #auto="matAutocomplete" [displayWith]="mostrarOpcion">

        @for (opcion of opciones; track opcion.id) {
          <mat-option [value]="opcion">{{ texto(opcion) }}</mat-option>
        }

        @if (!opciones.length) {
          <mat-option disabled>{{ cargando ? 'Buscando...' : 'Sin resultados' }}</mat-option>
        }

      </mat-autocomplete>

      <mat-error>{{ mensajeError() }}</mat-error>

    </mat-form-field>
  `,
  styles: [`
    .campo {
      width: 100%;
    }
  `]
})
export class AutocompleteBusqueda<T extends { id: number }> implements OnInit {

  @Input({ required: true }) control!: FormControl<T | string | null>;
  @Input({ required: true }) etiqueta!: string;

  // Trae las opciones que coinciden con el texto (la API devuelve un máximo por búsqueda).
  @Input({ required: true }) buscar!: (texto: string) => Observable<T[]>;

  // Cómo se muestra cada opción (y la elegida dentro del input).
  @Input({ required: true }) texto!: (opcion: T) => string;

  @Input() placeholder = 'Escribí para buscar';

  opciones: T[] = [];
  cargando = false;

  private destroyRef = inject(DestroyRef);

  mostrarOpcion = (valor: T | string | null): string =>
    valor && typeof valor === 'object' ? this.texto(valor) : (valor ?? '');

  ngOnInit(): void {

    this.control.valueChanges.pipe(

      startWith(this.control.value),

      // Cuando el valor es una opción ya elegida no hace falta volver a buscar.
      filter((valor): valor is string | null => !valor || typeof valor !== 'object'),

      map(valor => (valor ?? '').trim()),
      debounceTime(250),
      distinctUntilChanged(),

      // switchMap descarta la búsqueda anterior si se sigue escribiendo.
      switchMap(texto => {
        this.cargando = true;

        return this.buscar(texto).pipe(
          catchError(() => of([] as T[])),
          finalize(() => this.cargando = false)
        );
      }),

      takeUntilDestroyed(this.destroyRef)

    ).subscribe(opciones => this.opciones = opciones);

  }

  mensajeError(): string {
    return mensajeDeControl(this.control);
  }

}
