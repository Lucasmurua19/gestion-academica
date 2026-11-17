import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from "@angular/router";
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Subject, catchError, map, of, switchMap } from 'rxjs';
import { Materias } from '../interfaces/Materias';
import { ResumenAcademico } from '../interfaces/Dashboard';
import { DashboardService } from '../services/dashboard-service';
import { MateriaService } from '../services/materia-service';
import { mensajeDeError } from '../utils/api-error';

// Dashboard Académico: resumen general y, filtrando por materia, cuántos alumnos están inscriptos en ella.
@Component({
  selector: 'app-dashboard-c',
  standalone:true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule
  ],
  templateUrl: './dashboard-c.html',
  styleUrl: './dashboard-c.scss',
})
export class DashboardC implements OnInit {

  resumen: ResumenAcademico | null = null;

  // Materia con la que se pidió el resumen que se está mostrando. Las etiquetas se calculan con esta (y no con el
  // desplegable) para que no digan una cosa mientras los números todavía son de la consulta anterior.
  materiaDelResumen: number | null = null;

  materias: Materias[] = [];
  materiaFiltro = new FormControl<number | null>(null);

  displayedColumns: string[] = ['materia', 'cantidad'];

  cargando = false;
  error: string | null = null;

  private recargar$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private materiaService: MateriaService
  ) {

    // switchMap: si cambia el filtro mientras carga, se descarta la respuesta de la consulta anterior.
    this.recargar$.pipe(

      switchMap(() => {
        const materiaId = this.materiaFiltro.value;

        this.cargando = true;
        this.error = null;

        return this.dashboardService.getResumen(materiaId).pipe(
          map(resumen => ({ resumen, materiaId })),
          catchError(err => {
            console.error('Error al traer el resumen académico', err);
            this.error = mensajeDeError(err, 'No se pudo cargar el resumen académico.');
            return of(null);
          })
        );
      }),

      takeUntilDestroyed()

    ).subscribe(resultado => {

      this.cargando = false;

      if (!resultado) {
        this.resumen = null;
        return;
      }

      this.resumen = resultado.resumen;
      this.materiaDelResumen = resultado.materiaId;

    });

    // Pedir un nuevo resumen cuando cambia el filtro.
    this.materiaFiltro.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(() => this.cargarResumen());

  }

  ngOnInit(): void {

    this.materiaService.getTodas().subscribe({
      next: (data) => this.materias = data,
      error: (err) => console.error('Error al cargar materias', err)
    });

    this.cargarResumen();

  }

  cargarResumen() {
    this.recargar$.next();
  }

  get hayFiltro(): boolean {
    return this.materiaDelResumen !== null;
  }

  // Sin filtro: todos los alumnos registrados (incluso los que no cursan nada). Con filtro: los inscriptos en esa materia.
  get etiquetaAlumnos(): string {
    return this.hayFiltro ? 'Alumnos inscriptos en la materia' : 'Alumnos registrados';
  }

  get valorAlumnos(): number {
    if (!this.resumen) return 0;

    return this.hayFiltro ? this.resumen.alumnosInscriptosActivos : this.resumen.totalAlumnosRegistrados;
  }

  get alcanceInscripciones(): string {
    if (!this.hayFiltro) return 'En todas las materias';

    const nombre = this.resumen?.inscripcionesPorMateria[0]?.nombre;
    return nombre ? `En ${nombre}` : 'En la materia elegida';
  }

}
