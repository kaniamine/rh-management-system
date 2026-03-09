import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeRhRoutingModule } from './home-rh-routing-module';
import { HomeRh } from './pages/home-rh/home-rh';

@NgModule({
  imports: [
    CommonModule,
    HomeRhRoutingModule,
    HomeRh
  ]
})
export class HomeRhModule {}