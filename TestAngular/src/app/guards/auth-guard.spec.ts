import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';

import { authGuard } from './auth-guard';

describe('authGuard', () => {
  let router: Router;

  const ejecutar = () => TestBed.runInInjectionContext(
    () => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  );

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  afterEach(() => localStorage.clear());

  it('should redirect to /login when there is no session', () => {
    expect(ejecutar()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should let the user through when there is a session', () => {
    localStorage.setItem('token', 'abc');

    expect(ejecutar()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
