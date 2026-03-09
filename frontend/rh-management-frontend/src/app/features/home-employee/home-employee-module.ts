import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeEmployeeRoutingModule } from './home-employee-routing-module';
import { HomeEmployee } from './pages/home-employee/home-employee';

@NgModule({
  imports: [
    CommonModule,
    HomeEmployeeRoutingModule,
    HomeEmployee
  ]
})
export class HomeEmployeeModule {}