import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeConge } from './pages/demande-conge/demande-conge';
import { DemandeAutorisation } from './pages/demande-autorisation/demande-autorisation';
import { DemandeCongeArrMaladie } from './pages/demande-conge-maladie/demande-conge-maladie';
import { CongeRoutingModule } from './conge-routing-module';

@NgModule({
  imports: [
    CommonModule,
    CongeRoutingModule,
    DemandeConge,
    DemandeAutorisation,
    DemandeCongeArrMaladie
  ]
})
export class CongeModule {}