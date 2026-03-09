import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRhRoutingModule } from './dashboard-rh-routing-module';
import { RhDashboard } from './pages/rh-dashboard/rh-dashboard';

@NgModule({

  imports: [
    CommonModule,
    DashboardRhRoutingModule,
    RhDashboard
  ],
})
export class DashboardRhModule {}