import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PointageRoutingModule } from './pointage-routing-module';
import { Pointage } from './pages/pointage/pointage';

@NgModule({
  imports: [CommonModule, PointageRoutingModule, Pointage]
})
export class PointageModule {}
