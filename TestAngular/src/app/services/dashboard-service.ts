import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResumenAcademico } from '../interfaces/Dashboard';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {

  private ApiUrl: string = `${environment.apiUrl}/dashboard-academico`;

  constructor(

    private http: HttpClient

  ) { }

  // GET /api/dashboard-academico?materiaId=2  (sin materiaId devuelve el resumen general)
  getResumen(materiaId?: number | null): Observable<ResumenAcademico> {

    let params = new HttpParams();

    if (materiaId) {
      params = params.set('materiaId', materiaId);
    }

    return this.http.get<ResumenAcademico>(this.ApiUrl, { params });

  }

}
