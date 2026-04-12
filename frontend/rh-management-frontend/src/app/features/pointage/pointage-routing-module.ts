import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Pointage } from './pages/pointage/pointage';

const routes: Routes = [
  { path: '', component: Pointage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PointageRoutingModule {}
