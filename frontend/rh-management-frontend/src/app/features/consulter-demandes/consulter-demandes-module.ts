import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsulterDemandesRoutingModule } from './consulter-demandes-routing-module';
import { ConsulterDemandes } from './pages/consulter-demandes/consulter-demandes';

@NgModule({
  imports: [
    CommonModule,
    ConsulterDemandesRoutingModule,
    ConsulterDemandes
  ]
})
export class ConsulterDemandesModule {}
