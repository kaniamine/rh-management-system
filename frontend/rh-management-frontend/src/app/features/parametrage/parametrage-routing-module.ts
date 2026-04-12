import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Parametrage } from './pages/parametrage/parametrage';

const routes: Routes = [
  { path: '', component: Parametrage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParametrageRoutingModule {}
