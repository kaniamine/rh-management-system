import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParametrageRoutingModule } from './parametrage-routing-module';
import { Parametrage } from './pages/parametrage/parametrage';

@NgModule({
  imports: [CommonModule, ParametrageRoutingModule, Parametrage]
})
export class ParametrageModule {}
