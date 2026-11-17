import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Inscripcion } from '../interfaces/Inscripcion';
import { InscripcionService } from '../services/inscripcion-service';
import { mostrarError } from '../utils/api-error';

// Confirmación de baja. La baja no borra nada: la inscripción queda en el historial con estado "Baja".
@Component({
  selector: 'app-dialog-baja-inscripcion',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `

    <h2 mat-dialog-title>Dar de baja la inscripción</h2>

    <mat-dialog-content>

      <p>
        ¿Dar de baja a <strong>{{ data.inscripcion.alumnoNombre }}</strong>
        de <strong>{{ data.inscripcion.materiaNombre }}</strong>?
      </p>

      <p class="nota">
        Queda registrada en el historial con la fecha de hoy. Después podés volver a inscribirlo en la misma materia.
      </p>

    </mat-dialog-content>

    <mat-dialog-actions align="end">

      <button mat-button type="button" (click)="cancelar()">Cancelar</button>

      <button mat-raised-button color="warn" type="button" [disabled]="guardando" (click)="confirmar()">
        Dar de baja
      </button>

    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 350px;
    }

    .nota {
      font-size: 12px;
      opacity: 0.7;
    }
  `]
})
export class DialogBajaInscripcion {

  guardando = false;

  constructor(

    private dialogRef: MatDialogRef<DialogBajaInscripcion>,
    @Inject(MAT_DIALOG_DATA) public data: { inscripcion: Inscripcion },
    private inscripcionService: InscripcionService

  ) { }

  confirmar() {

    this.guardando = true;

    this.inscripcionService.darDeBaja(this.data.inscripcion.id).subscribe({

      next: () => this.dialogRef.close(true),

      error: (err) => {
        this.guardando = false;
        mostrarError('No se pudo dar de baja', err, 'No se pudo dar de baja la inscripción.');
      }

    });
  }

  cancelar() {
    this.dialogRef.close();
  }

}
