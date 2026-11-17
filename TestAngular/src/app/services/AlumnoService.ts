import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alumno } from '../interfaces/Alumno';
import { CrearAlumnoDto } from '../interfaces/CrearAlumnoDto';
import { FiltroAlumnos, PagedResult } from '../interfaces/Paginacion';


@Injectable({
  providedIn: 'root',
})
export class alumnosService {

  private ApiUrl: string = `${environment.apiUrl}/Alumno`;

  // https://localhost:7197/api


  constructor(

    private http: HttpClient

  ) { }


  // GET /api/Alumno?page=1&pageSize=10&search=ana  (la búsqueda vacía no se envía)
  getAll(filtro: FiltroAlumnos): Observable<PagedResult<Alumno>> {

    let params = new HttpParams()
      .set('page', filtro.page)
      .set('pageSize', filtro.pageSize);

    const search = filtro.search?.trim();

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PagedResult<Alumno>>(this.ApiUrl, { params });

  }


  getById(id: number): Observable<Alumno> {

    return this.http.get<Alumno>(`${this.ApiUrl}/${id}`);

  }

  create(alumno: CrearAlumnoDto): Observable<Alumno> {

    return this.http.post<Alumno>(this.ApiUrl, alumno);

  }

  update(id: number, alumno: CrearAlumnoDto): Observable<void> {

    return this.http.put<void>(`${this.ApiUrl}/${id}`, alumno);

  }

  delete(id: number): Observable<void> {

    return this.http.delete<void>(`${this.ApiUrl}/${id}`);

  }

}
