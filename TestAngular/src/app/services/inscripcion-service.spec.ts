import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { InscripcionService } from './inscripcion-service';
import { environment } from '../../environments/environment';

describe('InscripcionService', () => {
  let service: InscripcionService;
  let httpMock: HttpTestingController;

  const url = `${environment.apiUrl}/inscripciones`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(InscripcionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should send the pagination and every filter', () => {
    service.getAll({ page: 2, pageSize: 5, alumnoId: 3, materiaId: 4, estado: 'Baja' }).subscribe();

    const req = httpMock.expectOne(r => r.url === url);
    expect(req.request.method).toBe('GET');
    expect(String(req.request.params.get('page'))).toBe('2');
    expect(String(req.request.params.get('pageSize'))).toBe('5');
    expect(String(req.request.params.get('alumnoId'))).toBe('3');
    expect(String(req.request.params.get('materiaId'))).toBe('4');
    expect(req.request.params.get('estado')).toBe('Baja');
    req.flush({ items: [], totalCount: 0, page: 2, pageSize: 5 });
  });

  it('should not send empty filters', () => {
    service.getAll({ page: 1, pageSize: 10, alumnoId: null, materiaId: null, estado: null }).subscribe();

    const req = httpMock.expectOne(r => r.url === url);
    expect(req.request.params.has('alumnoId')).toBeFalse();
    expect(req.request.params.has('materiaId')).toBeFalse();
    expect(req.request.params.has('estado')).toBeFalse();
    req.flush({ items: [], totalCount: 0, page: 1, pageSize: 10 });
  });

  it('should POST the alumno and materia ids to enroll', () => {
    service.inscribir({ alumnoId: 3, materiaId: 4 }).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ alumnoId: 3, materiaId: 4 });
    req.flush({}, { status: 201, statusText: 'Created' });
  });

  it('should PATCH /{id}/baja to drop an enrollment', () => {
    service.darDeBaja(7).subscribe();

    const req = httpMock.expectOne(`${url}/7/baja`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
