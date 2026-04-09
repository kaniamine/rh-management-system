import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DgValidations } from './pages/dg-validations/dg-validations';
import { DgRoutingModule } from './dg-routing-module';

@NgModule({
  imports: [
    CommonModule,
    DgRoutingModule,
    DgValidations
  ]
})
export class DgModule {}
