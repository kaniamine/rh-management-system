import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DemandeConge } from './pages/demande-conge/demande-conge';
import { DemandeAutorisation } from './pages/demande-autorisation/demande-autorisation';
import { DemandeCongeArrMaladie } from './pages/demande-conge-maladie/demande-conge-maladie';

const routes: Routes = [
  { path: '', component: DemandeConge },
  { path: 'demande-autorisation', component: DemandeAutorisation },
  { path: 'demande-maladie', component: DemandeCongeArrMaladie }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CongeRoutingModule {}