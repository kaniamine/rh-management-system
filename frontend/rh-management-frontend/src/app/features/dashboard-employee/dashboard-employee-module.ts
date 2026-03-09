import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardEmployeeRoutingModule } from './dashboard-employee-routing-module';
import { EmployeeDashboard } from './pages/employee-dashboard/employee-dashboard';

@NgModule({
 
  imports: [
    CommonModule,
    DashboardEmployeeRoutingModule,
    EmployeeDashboard
  ]
})
export class DashboardEmployeeModule {}