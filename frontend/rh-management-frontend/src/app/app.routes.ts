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
    path: '',
    redirectTo: 'conge',
    pathMatch: 'full'
  }
];