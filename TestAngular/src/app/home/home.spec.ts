import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to the dashboards', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.navegarAlDashboardB();
    component.navegarAlDashboardC();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboardB']);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard-academico']);
  });
});
