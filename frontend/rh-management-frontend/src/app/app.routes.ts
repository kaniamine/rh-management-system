import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'home-employee',
    loadChildren: () =>
      import('./features/home-employee/home-employee-module').then(m => m.HomeEmployeeModule)
  },
  {
    path: 'home-rh',
    loadChildren: () =>
      import('./features/home-rh/home-rh-module').then(m => m.HomeRhModule)
  },
  {
    path: 'conge',
    loadChildren: () =>
      import('./features/conge/conge-module').then(m => m.CongeModule)
  },
  {
    path: 'dashboard-employee',
    loadChildren: () =>
      import('./features/dashboard-employee/dashboard-employee-module').then(m => m.DashboardEmployeeModule)
  },
  {
    path: 'dashboard-rh',
    loadChildren: () =>
      import('./features/dashboard-rh/dashboard-rh-module').then(m => m.DashboardRhModule)
  },

  {
    path: 'personnel',
    loadChildren: () =>
      import('./features/personnel/personnel-module').then(m => m.PersonnelModule)
  },
  {
    path: 'responsable',
    loadChildren: () =>
      import('./features/responsable/responsable-module').then(m => m.ResponsableModule)
  },
  {
    path: 'dg',
    loadChildren: () =>
      import('./features/dg/dg-module').then(m => m.DgModule)
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