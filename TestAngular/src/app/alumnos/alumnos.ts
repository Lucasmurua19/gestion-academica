import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { Alumno } from '../interfaces/Alumno';
import { alumnosService } from '../services/AlumnoService';
import { AuthService } from '../services/auth-service';
import { mostrarError } from '../utils/api-error';
import Swal from 'sweetalert2';
import { AlumnoDialogComponent } from '../dialog-agregar-alumno/dialog-agregar-alumno';

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [

    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './alumnos.html',
  styleUrl: './alumnos.scss',
})
export class AlumnosComponent implements OnInit {

  alumnos: Alumno[] = [];
  displayedColumns: string[] = [];

  // La paginación la hace el servidor. page empieza en 1 (el MatPaginator usa pageIndex, que empieza en 0).
  page = 1;
  pageSize = 10;
  totalCount = 0;
  pageSizeOptions: number[] = [5, 10, 25];
  cargando = false;

  busqueda = new FormControl('', { nonNullable: true });

  private recargar$ = new Subject<void>();

  constructor(
    private alumnosService: alumnosService,
    private dialog: MatDialog,
    protected authService: AuthService
  ) {

    // Solo el Admin ve la columna de acciones (la API igual lo valida).
    this.displayedColumns = this.esAdmin
      ? ['id', 'nombre', 'email', 'acciones']
      : ['id', 'nombre', 'email'];

    // switchMap: si llega una recarga nueva, se descarta la respuesta de la anterior.
    this.recargar$.pipe(

      switchMap(() => {
        this.cargando = true;

        return this.alumnosService.getAll({
          page: this.page,
          pageSize: this.pageSize,
          search: this.busqueda.value
        }).pipe(
          catchError(err => {
            console.error('Error al traer alumnos', err);
            mostrarError('Error', err, 'No se pudieron cargar los alumnos.');
            return of(null);
          })
        );
      }),

      takeUntilDestroyed()

    ).subscribe(resultado => {

      this.cargando = false;
      if (!resultado) return;

      this.alumnos = resultado.items;
      this.totalCount = resultado.totalCount;

      // Si se borró el último alumno de la última página, esa página quedó vacía: se vuelve a la anterior.
      const ultimaPagina = Math.max(1, Math.ceil(resultado.totalCount / this.pageSize));

      if (this.page > ultimaPagina) {
        this.page = ultimaPagina;
        this.recargar$.next();
      }

    });

    // Al cambiar el filtro se vuelve a la primera página.
    this.busqueda.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.cambioDeFiltro());

  }

  get esAdmin(): boolean {
    return this.authService.esAdmin();
  }

  ngOnInit(): void {

    this.cargarAlumnos();

  }

  cargarAlumnos() {
    this.recargar$.next();
  }

  cambioDeFiltro() {
    this.page = 1;
    this.cargarAlumnos();
  }

  onPage(evento: PageEvent) {
    this.page = evento.pageIndex + 1;
    this.pageSize = evento.pageSize;
    this.cargarAlumnos();
  }

  agregarAlumno() {

    const dialogRef = this.dialog.open(AlumnoDialogComponent, {
      data: {}
    });

    // El diálogo guarda por su cuenta (para mostrar los errores de campo) y se cierra con true si salió bien.
    dialogRef.afterClosed().subscribe(guardado => {
      if (!guardado) return;

      Swal.fire('Listo', 'Alumno agregado correctamente.', 'success');
      this.cargarAlumnos();
    });

  }

  editarAlumno(alumno: Alumno) {

    const dialogRef = this.dialog.open(AlumnoDialogComponent, {
      data: { alumno }
    });

    dialogRef.afterClosed().subscribe(guardado => {
      if (!guardado) return;

      Swal.fire('Guardado', 'Alumno actualizado correctamente.', 'success');
      this.cargarAlumnos();
    });

  }

  eliminar(alumno: Alumno) {
    Swal.fire({
      title: '¿Eliminar alumno?',
      text: `Vas a eliminar a ${alumno.nombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.alumnosService.delete(alumno.id).subscribe({
        next: () => {
          Swal.fire('Eliminado', 'El alumno fue eliminado.', 'success');
          this.cargarAlumnos();
        },
        // Un alumno con inscripciones no se puede borrar (se conserva el historial): la API responde 409 con el motivo.
        error: (err) => mostrarError('No se pudo eliminar', err, 'No se pudo eliminar el alumno.')
      });
    });
  }
}
