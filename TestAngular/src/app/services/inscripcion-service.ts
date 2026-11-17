import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrearInscripcionDto, Inscripcion } from '../interfaces/Inscripcion';
import { FiltroInscripciones, PagedResult } from '../interfaces/Paginacion';

@Injectable({
  providedIn: 'root',
})
export class InscripcionService {

  private ApiUrl: string = `${environment.apiUrl}/inscripciones`;

  constructor(

    private http: HttpClient

  ) { }

  // GET /api/inscripciones?page=1&pageSize=10&alumnoId=3&materiaId=2&estado=Activa  (los filtros vacíos no se envían)
  getAll(filtro: FiltroInscripciones): Observable<PagedResult<Inscripcion>> {

    let params = new HttpParams()
      .set('page', filtro.page)
      .set('pageSize', filtro.pageSize);

    if (filtro.alumnoId) {
      params = params.set('alumnoId', filtro.alumnoId);
    }

    if (filtro.materiaId) {
      params = params.set('materiaId', filtro.materiaId);
    }

    if (filtro.estado) {
      params = params.set('estado', filtro.estado);
    }

    return this.http.get<PagedResult<Inscripcion>>(this.ApiUrl, { params });

  }

  inscribir(inscripcion: CrearInscripcionDto): Observable<Inscripcion> {

    return this.http.post<Inscripcion>(this.ApiUrl, inscripcion);

  }

  darDeBaja(id: number): Observable<void> {

    return this.http.patch<void>(`${this.ApiUrl}/${id}/baja`, null);

  }

}
