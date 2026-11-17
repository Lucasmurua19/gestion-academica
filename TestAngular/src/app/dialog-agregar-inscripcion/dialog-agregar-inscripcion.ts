import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { map } from 'rxjs';
import { Alumno } from '../interfaces/Alumno';
import { Materias } from '../interfaces/Materias';
import { alumnosService } from '../services/AlumnoService';
import { MateriaService } from '../services/materia-service';
import { InscripcionService } from '../services/inscripcion-service';
import { AutocompleteBusqueda, debeSerSeleccion } from '../autocomplete-busqueda/autocomplete-busqueda';
import { mostrarError } from '../utils/api-error';

// Cuántas opciones trae cada búsqueda: alcanza para elegir y se afina escribiendo.
const OPCIONES_POR_BUSQUEDA = 20;

@Component({
  selector: 'app-dialog-agregar-inscripcion',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    AutocompleteBusqueda,
  ],
  template: `

    <h2 mat-dialog-title>Nueva inscripción</h2>

    <form [formGroup]="form" (ngSubmit)="confirmar()">

      <mat-dialog-content>

        <app-autocomplete-busqueda
          etiqueta="Alumno"
          placeholder="Buscá por nombre o email"
          [control]="form.controls.alumno"
          [buscar]="buscarAlumnos"
          [texto]="textoAlumno">
        </app-autocomplete-busqueda>

        <app-autocomplete-busqueda
          etiqueta="Materia"
          placeholder="Buscá por nombre"
          [control]="form.controls.materia"
          [buscar]="buscarMaterias"
          [texto]="textoMateria">
        </app-autocomplete-busqueda>

      </mat-dialog-content>

      <mat-dialog-actions align="end">

        <button mat-button type="button" (click)="cancelar()">Cancelar</button>

        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || guardando">
          Inscribir
        </button>

      </mat-dialog-actions>

    </form>
  `,
  styles: [`
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 380px;
    }
  `]
})
export class DialogAgregarInscripcion {

  form = new FormGroup({
    alumno: new FormControl<Alumno | string | null>(null, [debeSerSeleccion]),
    materia: new FormControl<Materias | string | null>(null, [debeSerSeleccion]),
  });

  guardando = false;

  constructor(

    private dialogRef: MatDialogRef<DialogAgregarInscripcion>,
    private alumnosService: alumnosService,
    private materiaService: MateriaService,
    private inscripcionService: InscripcionService

  ) { }

  // Las búsquedas consultan los listados de la API (con su filtro "search").
  buscarAlumnos = (texto: string) =>
    this.alumnosService.getAll({ page: 1, pageSize: OPCIONES_POR_BUSQUEDA, search: texto }).pipe(map(r => r.items));

  buscarMaterias = (texto: string) =>
    this.materiaService.getAll({ page: 1, pageSize: OPCIONES_POR_BUSQUEDA, search: texto }).pipe(map(r => r.items));

  textoAlumno = (alumno: Alumno) => `${alumno.nombre} (${alumno.email})`;
  textoMateria = (materia: Materias) => materia.nombre;

  confirmar() {

    const { alumno, materia } = this.form.getRawValue();

    if (this.form.invalid || typeof alumno !== 'object' || typeof materia !== 'object' || !alumno || !materia) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;

    this.inscripcionService.inscribir({ alumnoId: alumno.id, materiaId: materia.id }).subscribe({

      next: () => this.dialogRef.close(true),

      error: (err) => {
        this.guardando = false;

        // 409 (ya tiene una inscripción activa en esa materia) y 404: la API explica el motivo.
        mostrarError('No se pudo inscribir', err, 'No se pudo crear la inscripción.');
      }

    });
  }

  cancelar() {
    this.dialogRef.close();
  }

}
