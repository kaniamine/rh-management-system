import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DemandeConge } from './pages/demande-conge/demande-conge';

const routes: Routes = [
  { path: '', component: DemandeConge }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CongeRoutingModule {}