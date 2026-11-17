import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { alumnosService } from './AlumnoService';
import { environment } from '../../environments/environment';

describe('alumnosService', () => {
  let service: alumnosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(alumnosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should send page, pageSize and the trimmed search', () => {
    service.getAll({ page: 2, pageSize: 5, search: '  ana ' }).subscribe();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/Alumno`);
    expect(req.request.method).toBe('GET');
    expect(String(req.request.params.get('page'))).toBe('2');
    expect(String(req.request.params.get('pageSize'))).toBe('5');
    expect(req.request.params.get('search')).toBe('ana');
    req.flush({ items: [], totalCount: 0, page: 2, pageSize: 5 });
  });

  it('should not send an empty search', () => {
    service.getAll({ page: 1, pageSize: 10, search: '   ' }).subscribe();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/Alumno`);
    expect(req.request.params.has('search')).toBeFalse();
    req.flush({ items: [], totalCount: 0, page: 1, pageSize: 10 });
  });

  it('should send the new student (personal data only) to the API on create', () => {
    const alumno = { nombre: 'Ana', email: 'ana@mail.com' };

    service.create(alumno).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/Alumno`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(alumno);
    req.flush({ id: 1, ...alumno });
  });
});
