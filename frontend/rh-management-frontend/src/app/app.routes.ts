import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'home-employee',
    loadChildren: () =>
      import('./features/home-employee/home-employee-module').then(m => m.HomeEmployeeModule),
    canActivate: [authGuard]
  },
  {
    path: 'home-rh',
    loadChildren: () =>
      import('./features/home-rh/home-rh-module').then(m => m.HomeRhModule),
    canActivate: [authGuard]
  },
  {
    path: 'conge',
    loadChildren: () =>
      import('./features/conge/conge-module').then(m => m.CongeModule),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard-employee',
    loadChildren: () =>
      import('./features/dashboard-employee/dashboard-employee-module').then(m => m.DashboardEmployeeModule),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard-rh',
    loadChildren: () =>
      import('./features/dashboard-rh/dashboard-rh-module').then(m => m.DashboardRhModule),
    canActivate: [authGuard]
  },
  {
    path: 'personnel',
    loadChildren: () =>
      import('./features/personnel/personnel-module').then(m => m.PersonnelModule),
    canActivate: [authGuard]
  },
  {
    path: 'responsable',
    loadChildren: () =>
      import('./features/responsable/responsable-module').then(m => m.ResponsableModule),
    canActivate: [authGuard]
  },
  {
    path: 'dg',
    loadChildren: () =>
      import('./features/dg/dg-module').then(m => m.DgModule),
    canActivate: [authGuard]
  },
  {
    path: 'parametrage',
    loadChildren: () =>
      import('./features/parametrage/parametrage-module').then(m => m.ParametrageModule),
    canActivate: [authGuard]
  },
  {
    path: 'pointage',
    loadChildren: () =>
      import('./features/pointage/pointage-module').then(m => m.PointageModule),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
