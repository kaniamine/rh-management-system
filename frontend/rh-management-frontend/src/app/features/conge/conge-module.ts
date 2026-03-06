import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CongeRoutingModule } from './conge-routing-module';
import { DemandeConge } from './pages/demande-conge/demande-conge';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    CongeRoutingModule,
    DemandeConge
  ]
})
export class CongeModule {}