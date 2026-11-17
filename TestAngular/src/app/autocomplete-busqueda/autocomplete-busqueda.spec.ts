import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { Observable, of, throwError } from 'rxjs';

import { AutocompleteBusqueda, debeSerSeleccion } from './autocomplete-busqueda';

interface Opcion { id: number; nombre: string; }

describe('AutocompleteBusqueda', () => {
  let fixture: ComponentFixture<AutocompleteBusqueda<Opcion>>;
  let component: AutocompleteBusqueda<Opcion>;
  let control: FormControl<Opcion | string | null>;
  let buscar: jasmine.Spy<(texto: string) => Observable<Opcion[]>>;

  const ana: Opcion = { id: 1, nombre: 'Ana' };
  const beto: Opcion = { id: 2, nombre: 'Beto' };

  function crear(valorInicial: Opcion | string | null = null) {
    control = new FormControl<Opcion | string | null>(valorInicial, [debeSerSeleccion]);

    fixture = TestBed.createComponent(AutocompleteBusqueda<Opcion>);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('etiqueta', 'Alumno');
    fixture.componentRef.setInput('buscar', buscar);
    fixture.componentRef.setInput('texto', (o: Opcion) => o.nombre);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    buscar = jasmine.createSpy('buscar').and.callFake((texto: string) =>
      of([ana, beto].filter(o => o.nombre.toLowerCase().includes(texto.toLowerCase())))
    );

    await TestBed.configureTestingModule({ imports: [AutocompleteBusqueda] }).compileComponents();
  });

  it('should load the first options (empty search) as soon as it starts', fakeAsync(() => {
    crear();

    tick(250);

    expect(buscar).toHaveBeenCalledOnceWith('');
    expect(component.opciones).toEqual([ana, beto]);
  }));

  it('should wait 250 ms while typing and then search the typed text', fakeAsync(() => {
    crear();
    tick(250);
    buscar.calls.reset();

    control.setValue('be');
    tick(249);
    expect(buscar).not.toHaveBeenCalled();

    tick(1);
    expect(buscar).toHaveBeenCalledOnceWith('be');
    expect(component.opciones).toEqual([beto]);
  }));

  it('should not search again when an option is picked from the list', fakeAsync(() => {
    crear();
    tick(250);
    buscar.calls.reset();

    control.setValue(ana);
    tick(500);

    expect(buscar).not.toHaveBeenCalled();
  }));

  it('should only accept a picked option, not free text', () => {
    expect(debeSerSeleccion(new FormControl('texto suelto'))).toEqual({ seleccion: true });
    expect(debeSerSeleccion(new FormControl(null))).toEqual({ seleccion: true });
    expect(debeSerSeleccion(new FormControl(ana))).toBeNull();
  });

  it('should show the picked option text inside the input and ask to pick one when it is free text', fakeAsync(() => {
    crear();
    tick(250);

    expect(component.mostrarOpcion(ana)).toBe('Ana');
    expect(component.mostrarOpcion('algo')).toBe('algo');
    expect(component.mostrarOpcion(null)).toBe('');

    control.setValue('texto suelto');
    expect(component.mensajeError()).toBe('Elegí una opción de la lista.');
    tick(250);
  }));

  it('should survive a failing search and show no options', fakeAsync(() => {
    buscar.and.returnValue(throwError(() => new Error('sin conexión')));
    crear();

    tick(250);

    expect(component.opciones).toEqual([]);
    expect(component.cargando).toBeFalse();
  }));
});
