import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResponsableValidations } from './pages/responsable-validations/responsable-validations';
import { ResponsableRoutingModule } from './responsable-routing-module';

@NgModule({
  imports: [
    CommonModule,
    ResponsableRoutingModule,
    ResponsableValidations
  ]
})
export class ResponsableModule {}
