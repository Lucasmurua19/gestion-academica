import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [


    {
        path: '',
        loadComponent: () =>
            import('./home/home').then(m => m.Home)
    },

    {
        path: 'home',
        loadComponent: () =>
            import('./home/home').then(m => m.Home)
    },

    {
        path: 'dashboardA',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./dashboard-a/dashboard-a').then(m => m.DashboardA)

    },

    {
        path: 'dashboardB',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./dashboard-b/dashboard-b').then(m => m.DashboardB)
    },

    {
        path: 'inscripciones',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./inscripciones/inscripciones').then(m => m.Inscripciones)
    },

    // Dashboard C pasó a ser el Dashboard Académico.
    {
        path: 'dashboard-academico',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./dashboard-c/dashboard-c').then(m => m.DashboardC)
    },

    // La ruta anterior sigue funcionando.
    {
        path: 'dashboardC',
        redirectTo: 'dashboard-academico'
    },

    {
        path: 'login',
        loadComponent: () =>
            import('./login/login').then(m => m.Login)
    },

    {
        path: 'registro',
        loadComponent: () =>
            import('./registro/registro').then(m => m.Registro)
    }



];
