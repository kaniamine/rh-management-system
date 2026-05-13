import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeRh } from './pages/home-rh/home-rh';

const routes: Routes = [
  {
    path: '',
    component: HomeRh
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/password-reset-rh/password-reset-rh').then(m => m.PasswordResetRh)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRhRoutingModule {}