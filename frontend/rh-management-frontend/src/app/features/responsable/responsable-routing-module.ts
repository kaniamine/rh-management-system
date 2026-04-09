import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResponsableValidations } from './pages/responsable-validations/responsable-validations';

const routes: Routes = [
  { path: '', component: ResponsableValidations }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResponsableRoutingModule {}
