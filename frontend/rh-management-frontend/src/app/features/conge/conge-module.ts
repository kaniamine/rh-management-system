import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeConge } from './pages/demande-conge/demande-conge';
import { CongeRoutingModule } from './conge-routing-module';

@NgModule({
  imports: [
    CommonModule,
    CongeRoutingModule,
    DemandeConge
  ]
})
export class CongeModule {}