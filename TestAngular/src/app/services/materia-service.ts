
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Materias } from '../interfaces/Materias';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CrearMateriaDto } from '../interfaces/CrearMateriaDto';
import { FiltroMaterias, PagedResult } from '../interfaces/Paginacion';

@Injectable({
  providedIn: 'root',
})
export class MateriaService {


  private ApiUrl: string = `${environment.apiUrl}/Materia`;

  constructor(

    private http: HttpClient

  ) {

  }

  // GET /api/Materia?page=1&pageSize=10&search=mate  (para la tabla de materias)
  getAll(filtro: FiltroMaterias): Observable<PagedResult<Materias>> {

    let params = new HttpParams()
      .set('page', filtro.page)
      .set('pageSize', filtro.pageSize);

    const search = filtro.search?.trim();

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PagedResult<Materias>>(this.ApiUrl, { params });

  }

  // GET /api/Materia/todas: todas las materias, sin paginar (para los desplegables).
  getTodas(): Observable<Materias[]> {

    return this.http.get<Materias[]>(`${this.ApiUrl}/todas`);

  }

  getById(id: number): Observable<Materias> {

    return this.http.get<Materias>(`${this.ApiUrl}/${id}`);

  }

  CrearMateria(materia : CrearMateriaDto): Observable<Materias>{

    return this.http.post<Materias>(this.ApiUrl, materia);

  }

   update(id: number, materia: CrearMateriaDto): Observable<void> {

      return this.http.put<void>(`${this.ApiUrl}/${id}`, materia);

    }

    delete(id: number): Observable<void> {

      return this.http.delete<void>(`${this.ApiUrl}/${id}`);

  }




}
