import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'conge',
    loadChildren: () =>
      import('./features/conge/conge-module').then(m => m.CongeModule)
  },
  {
    path: 'personnel',
    loadChildren: () =>
      import('./features/personnel/personnel-module').then(m => m.PersonnelModule)
  },
   {
    path: 'dashboard-rh',
    loadChildren: () =>
      import('./features/dashboard-rh/dashboard-rh-module').then(m => m.DashboardRhModule)
  },
  {
    path: 'dashboard-employee',
    loadChildren: () =>
      import('./features/dashboard-employee/dashboard-employee-module').then(m => m.DashboardEmployeeModule)
  },


   {
    path: '',
    redirectTo: 'dashboard-employee',
    pathMatch: 'full'
  }
];