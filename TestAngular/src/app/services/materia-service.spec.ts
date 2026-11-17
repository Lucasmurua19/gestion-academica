import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MateriaService } from './materia-service';
import { environment } from '../../environments/environment';

describe('MateriaService', () => {
  let service: MateriaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(MateriaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should use the shared environment API url', () => {
    service.getAll({ page: 1, pageSize: 10 }).subscribe();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/Materia`);
    expect(String(req.request.params.get('page'))).toBe('1');
    expect(req.request.params.has('search')).toBeFalse();
    req.flush({ items: [], totalCount: 0, page: 1, pageSize: 10 });
  });

  it('should send the search text', () => {
    service.getAll({ page: 3, pageSize: 5, search: ' mate ' }).subscribe();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/Materia`);
    expect(req.request.params.get('search')).toBe('mate');
    req.flush({ items: [], totalCount: 0, page: 3, pageSize: 5 });
  });

  it('should ask for every materia (not paginated) for the dropdowns', () => {
    service.getTodas().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/Materia/todas`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
