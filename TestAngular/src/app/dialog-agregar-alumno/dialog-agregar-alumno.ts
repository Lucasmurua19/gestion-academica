import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Alumno } from '../interfaces/Alumno';
import { CrearAlumnoDto } from '../interfaces/CrearAlumnoDto';
import { Observable } from 'rxjs';
import { alumnosService } from '../services/AlumnoService';
import { aplicarErroresDeCampo, mensajeDeControl, mostrarError } from '../utils/api-error';

@Component({
  selector: 'app-alumno-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  template: `

    <h2 mat-dialog-title>{{ data.alumno ? 'Editar alumno' : 'Nuevo alumno' }}</h2>

    <form [formGroup]="form" (ngSubmit)="confirmar()">

      <mat-dialog-content>

        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" placeholder="Nombre">
          <mat-error>{{ mensaje('nombre') }}</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" placeholder="Email">
          <mat-error>{{ mensaje('email') }}</mat-error>
        </mat-form-field>

        <p class="nota">Las materias del alumno se gestionan desde Inscripciones.</p>

      </mat-dialog-content>

      <mat-dialog-actions align="end">

        <button mat-button type="button" (click)="cancelar()">Cancelar</button>

        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || guardando">
          {{ data.alumno ? 'Guardar' : 'Agregar' }}
        </button>

      </mat-dialog-actions>

    </form>
  `,
  styles: [`
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 350px;
    }

    .nota {
      margin: 0;
      font-size: 12px;
      opacity: 0.7;
    }
  `]
})
export class AlumnoDialogComponent {

  form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(200)] }),
  });

  guardando = false;

  constructor(
    private dialogRef: MatDialogRef<AlumnoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { alumno?: Alumno },
    private alumnosService: alumnosService

  ) {

    // Al editar se precargan los datos actuales del alumno.
    if (data.alumno) {
      this.form.patchValue({
        nombre: data.alumno.nombre,
        email: data.alumno.email,
      });
    }
  }

  mensaje(campo: 'nombre' | 'email'): string {
    return mensajeDeControl(this.form.controls[campo]);
  }

  confirmar() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const alumno: CrearAlumnoDto = this.form.getRawValue();

    const guardar: Observable<unknown> = this.data.alumno
      ? this.alumnosService.update(this.data.alumno.id, alumno)
      : this.alumnosService.create(alumno);

    this.guardando = true;

    guardar.subscribe({

      next: () => this.dialogRef.close(true),

      error: (err) => {
        this.guardando = false;

        // Un 400 con errores por campo se muestra debajo de cada input; el resto (409, 500, sin conexión...) en una alerta.
        if (!aplicarErroresDeCampo(this.form, err)) {
          mostrarError('Error', err, 'No se pudo guardar el alumno.');
        }
      }

    });
  }

  cancelar() {
    this.dialogRef.close();
  }
}
