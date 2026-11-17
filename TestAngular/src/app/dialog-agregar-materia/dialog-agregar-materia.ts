import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';
import { Materias } from '../interfaces/Materias';
import { MateriaService } from '../services/materia-service';
import { aplicarErroresDeCampo, mensajeDeControl, mostrarError } from '../utils/api-error';

@Component({
  selector: 'app-dialog-agregar-materia',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './dialog-agregar-materia.html',
  styleUrl: './dialog-agregar-materia.scss',
})
export class DialogAgregarMateria {

  form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)] }),
  });

  guardando = false;

  constructor(

    private dialogRef: MatDialogRef<DialogAgregarMateria>,
    @Inject(MAT_DIALOG_DATA) public data: { materia? : Materias},
    private materiaService: MateriaService

  ){

    // Al editar se precarga el nombre actual.
    if (data.materia) {
      this.form.patchValue({ nombre: data.materia.nombre });
    }

  }

  mensaje(): string {
    return mensajeDeControl(this.form.controls.nombre);
  }

  confirmar() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const materia = { nombre: this.form.getRawValue().nombre };

    const guardar: Observable<unknown> = this.data.materia
      ? this.materiaService.update(this.data.materia.id, materia)
      : this.materiaService.CrearMateria(materia);

    this.guardando = true;

    guardar.subscribe({

      next: () => this.dialogRef.close(true),

      error: (err) => {
        this.guardando = false;

        // Un 400 con errores por campo se muestra debajo del input; el resto en una alerta.
        if (!aplicarErroresDeCampo(this.form, err)) {
          mostrarError('Error', err, 'No se pudo guardar la materia.');
        }
      }

    });
  }

  cancelar() {
    this.dialogRef.close();
  }

}
