import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeEmployee } from './pages/home-employee/home-employee';

const routes: Routes = [
  {
    path: '',
    component: HomeEmployee
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeEmployeeRoutingModule {}