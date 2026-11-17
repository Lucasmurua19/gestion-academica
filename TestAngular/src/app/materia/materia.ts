import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MateriaService } from '../services/materia-service';
import { Materias } from '../interfaces/Materias';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { DialogAgregarMateria } from '../dialog-agregar-materia/dialog-agregar-materia';
import { AuthService } from '../services/auth-service';
import { mostrarError } from '../utils/api-error';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-materia',
  standalone: true,

  imports: [

    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule

  ],

  templateUrl: './materia.html',
  styleUrl: './materia.scss',
})
export class Materia implements OnInit {

  materia: Materias[] = [];
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

    //ACA DELCARAMOS EL SERVICIO PARA PODER UTILIZARLO EN LOS MÉTODOS

    private materiaService: MateriaService,
    private dialog: MatDialog,
    protected authService: AuthService

  ) {

    // Solo el Admin ve la columna de acciones (la API igual lo valida).
    this.displayedColumns = this.esAdmin
      ? ['id', 'nombre', 'acciones']
      : ['id', 'nombre'];

    // switchMap: si llega una recarga nueva, se descarta la respuesta de la anterior.
    this.recargar$.pipe(

      switchMap(() => {
        this.cargando = true;

        return this.materiaService.getAll({
          page: this.page,
          pageSize: this.pageSize,
          search: this.busqueda.value
        }).pipe(
          catchError(err => {
            console.error('err', err);
            mostrarError('Error', err, 'No se pudieron cargar las materias.');
            return of(null);
          })
        );
      }),

      takeUntilDestroyed()

    ).subscribe(resultado => {

      this.cargando = false;
      if (!resultado) return;

      this.materia = resultado.items;
      this.totalCount = resultado.totalCount;

      // Si se borró la última materia de la última página, esa página quedó vacía: se vuelve a la anterior.
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

    //ACÁ INICIALIZAMOS EL MÉTODO, Y SIRVE PARA CARGAR LA TABLITA
    this.cargarMaterias();

  }

  cargarMaterias() {

    this.recargar$.next();

  }

  cambioDeFiltro() {

    this.page = 1;
    this.cargarMaterias();

  }

  onPage(evento: PageEvent) {

    this.page = evento.pageIndex + 1;
    this.pageSize = evento.pageSize;
    this.cargarMaterias();

  }

  agregarMateria() {

    const dialogRef = this.dialog.open(DialogAgregarMateria, {
      data: {}
    });

    // El diálogo guarda por su cuenta (para mostrar los errores de campo) y se cierra con true si salió bien.
    dialogRef.afterClosed().subscribe(guardado => {

      if (!guardado)
        return;

      Swal.fire('Listo', 'Materia agregada correctamente.', 'success');

      this.cargarMaterias();

    });

  }


  eliminar(materia: Materias) {

    Swal.fire({
          title: '¿Eliminar materia?',
          text: `Vas a eliminar a ${materia.nombre}. Esta acción no se puede deshacer.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
        }).then(result => {
          if (!result.isConfirmed) return;

          this.materiaService.delete(materia.id).subscribe({
            next: () => {
              Swal.fire('Eliminado', 'La materia fue eliminada.', 'success');
              this.cargarMaterias();
            },
            // Si la materia tiene alumnos la API responde 409 con el motivo, y es lo que se muestra.
            error: (err) => mostrarError('No se pudo eliminar', err, 'No se pudo eliminar la materia.')
          });
        });

  }

  editarMateria(materia: Materias) {

    const dialogRef = this.dialog.open(DialogAgregarMateria, {
          data: { materia }
        });

        dialogRef.afterClosed().subscribe(guardado => {
          if (!guardado) return;

          Swal.fire('Guardado', 'Materia actualizada correctamente.', 'success');
          this.cargarMaterias();
        });

  }

}
