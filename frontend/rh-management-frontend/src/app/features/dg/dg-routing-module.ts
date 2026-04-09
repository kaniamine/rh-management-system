import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DgValidations } from './pages/dg-validations/dg-validations';

const routes: Routes = [
  { path: '', component: DgValidations }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DgRoutingModule {}
