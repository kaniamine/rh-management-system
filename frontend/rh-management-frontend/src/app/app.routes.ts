import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'personnel',
    loadComponent: () =>
      import('./features/personnel/pages/personnel-list/personnel-list')
        .then(m => m.PersonnelList)
  },
  {
    path: 'conge',
    loadComponent: () =>
      import('./features/conge/pages/demande-conge/demande-conge')
        .then(m => m.DemandeConge)
  },
  {
    path: '',
    redirectTo: 'personnel',
    pathMatch: 'full'
  }
];