import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardService } from './dashboard-service';
import { environment } from '../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  const url = `${environment.apiUrl}/dashboard-academico`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should ask for the general summary without materiaId', () => {
    service.getResumen().subscribe();

    const req = httpMock.expectOne(r => r.url === url);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('materiaId')).toBeFalse();
    req.flush({});
  });

  it('should treat a null filter as "all the materias"', () => {
    service.getResumen(null).subscribe();

    const req = httpMock.expectOne(r => r.url === url);
    expect(req.request.params.has('materiaId')).toBeFalse();
    req.flush({});
  });

  it('should send the selected materiaId', () => {
    service.getResumen(2).subscribe();

    const req = httpMock.expectOne(r => r.url === url);
    expect(String(req.request.params.get('materiaId'))).toBe('2');
    req.flush({});
  });
});
