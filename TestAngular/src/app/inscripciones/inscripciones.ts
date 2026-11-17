import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, catchError, distinctUntilChanged, map, of, skip, startWith, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { Alumno } from '../interfaces/Alumno';
import { EstadoInscripcion, Inscripcion } from '../interfaces/Inscripcion';
import { Materias } from '../interfaces/Materias';
import { alumnosService } from '../services/AlumnoService';
import { MateriaService } from '../services/materia-service';
import { InscripcionService } from '../services/inscripcion-service';
import { AuthService } from '../services/auth-service';
import { mensajeDeError } from '../utils/api-error';
import { AutocompleteBusqueda } from '../autocomplete-busqueda/autocomplete-busqueda';
import { DialogAgregarInscripcion } from '../dialog-agregar-inscripcion/dialog-agregar-inscripcion';
import { DialogBajaInscripcion } from '../dialog-baja-inscripcion/dialog-baja-inscripcion';

@Component({
  selector: 'app-inscripciones',
  standalone: true,
  imports: [

    ReactiveFormsModule,
    RouterModule,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    AutocompleteBusqueda
  ],
  templateUrl: './inscripciones.html',
  styleUrl: './inscripciones.scss',
})
export class Inscripciones implements OnInit {

  inscripciones: Inscripcion[] = [];
  materias: Materias[] = [];
  estados: EstadoInscripcion[] = ['Activa', 'Baja'];
  displayedColumns: string[] = [];

  // La paginación la hace el servidor. page empieza en 1 (el MatPaginator usa pageIndex, que empieza en 0).
  page = 1;
  pageSize = 10;
  totalCount = 0;
  pageSizeOptions: number[] = [5, 10, 25];

  cargando = false;
  errorCarga: string | null = null;

  // Filtros. El del alumno es un autocompletado: solo filtra cuando hay un alumno elegido de la lista.
  alumnoFiltro = new FormControl<Alumno | string | null>(null);
  materiaFiltro = new FormControl<number | null>(null);
  estadoFiltro = new FormControl<EstadoInscripcion | null>(null);

  private recargar$ = new Subject<void>();

  constructor(
    private inscripcionService: InscripcionService,
    private alumnosService: alumnosService,
    private materiaService: MateriaService,
    private dialog: MatDialog,
    protected authService: AuthService
  ) {

    // Solo el Admin ve la columna de acciones (la API igual lo valida).
    this.displayedColumns = this.esAdmin
      ? ['alumno', 'materia', 'estado', 'alta', 'baja', 'acciones']
      : ['alumno', 'materia', 'estado', 'alta', 'baja'];

    // switchMap: si llega una recarga nueva, se descarta la respuesta de la anterior.
    this.recargar$.pipe(

      switchMap(() => {
        this.cargando = true;
        this.errorCarga = null;

        return this.inscripcionService.getAll({
          page: this.page,
          pageSize: this.pageSize,
          alumnoId: this.alumnoIdFiltrado,
          materiaId: this.materiaFiltro.value,
          estado: this.estadoFiltro.value
        }).pipe(
          catchError(err => {
            console.error('Error al traer inscripciones', err);
            this.errorCarga = mensajeDeError(err, 'No se pudieron cargar las inscripciones.');
            return of(null);
          })
        );
      }),

      takeUntilDestroyed()

    ).subscribe(resultado => {

      this.cargando = false;

      if (!resultado) {
        this.inscripciones = [];
        this.totalCount = 0;
        return;
      }

      this.inscripciones = resultado.items;
      this.totalCount = resultado.totalCount;

      // Si se quedó sin filas la última página (por ejemplo al cambiar el tamaño), se vuelve a la anterior.
      const ultimaPagina = Math.max(1, Math.ceil(resultado.totalCount / this.pageSize));

      if (this.page > ultimaPagina) {
        this.page = ultimaPagina;
        this.recargar$.next();
      }

    });

    // Al cambiar un filtro se vuelve a la primera página.
    // El del alumno solo cuenta cuando cambia el alumno elegido (no cada letra que se escribe).
    this.alumnoFiltro.valueChanges.pipe(
      map(() => this.alumnoIdFiltrado),
      startWith(null as number | null),
      distinctUntilChanged(),
      skip(1),
      takeUntilDestroyed()
    ).subscribe(() => this.cambioDeFiltro());

    this.materiaFiltro.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.cambioDeFiltro());
    this.estadoFiltro.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.cambioDeFiltro());

  }

  get esAdmin(): boolean {
    return this.authService.esAdmin();
  }

  get alumnoIdFiltrado(): number | null {
    const alumno = this.alumnoFiltro.value;
    return alumno && typeof alumno === 'object' ? alumno.id : null;
  }

  ngOnInit(): void {

    this.materiaService.getTodas().subscribe({
      next: (data) => this.materias = data,
      error: (err) => console.error('Error al cargar materias', err)
    });

    this.cargarInscripciones();

  }

  buscarAlumnos = (texto: string) =>
    this.alumnosService.getAll({ page: 1, pageSize: 20, search: texto }).pipe(map(r => r.items));

  textoAlumno = (alumno: Alumno) => `${alumno.nombre} (${alumno.email})`;

  cargarInscripciones() {
    this.recargar$.next();
  }

  cambioDeFiltro() {
    this.page = 1;
    this.cargarInscripciones();
  }

  onPage(evento: PageEvent) {
    this.page = evento.pageIndex + 1;
    this.pageSize = evento.pageSize;
    this.cargarInscripciones();
  }

  nuevaInscripcion() {

    const dialogRef = this.dialog.open(DialogAgregarInscripcion);

    // El diálogo guarda por su cuenta y se cierra con true si salió bien.
    dialogRef.afterClosed().subscribe(guardado => {
      if (!guardado) return;

      Swal.fire('Listo', 'Inscripción creada correctamente.', 'success');
      this.cargarInscripciones();
    });

  }

  darDeBaja(inscripcion: Inscripcion) {

    const dialogRef = this.dialog.open(DialogBajaInscripcion, {
      data: { inscripcion }
    });

    dialogRef.afterClosed().subscribe(confirmada => {
      if (!confirmada) return;

      Swal.fire('Listo', 'La inscripción fue dada de baja.', 'success');
      this.cargarInscripciones();
    });

  }

}
