import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeRh } from './pages/home-rh/home-rh';

const routes: Routes = [
  {
    path: '',
    component: HomeRh
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRhRoutingModule {}