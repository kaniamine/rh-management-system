import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DemandeConge } from './pages/demande-conge/demande-conge';
import { DemandeAutorisation } from './pages/demande-autorisation/demande-autorisation';

const routes: Routes = [
  { path: '', component: DemandeConge },
  { path: 'demande-autorisation', component: DemandeAutorisation }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CongeRoutingModule {}