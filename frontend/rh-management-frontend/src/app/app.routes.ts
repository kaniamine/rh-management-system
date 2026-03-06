import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'personnel',
    loadChildren: () =>
      import('./features/personnel/personnel-module').then(
        (m) => m.PersonnelModule
      )
  },
  {
    path: '',
    redirectTo: 'personnel',
    pathMatch: 'full'
  }
];