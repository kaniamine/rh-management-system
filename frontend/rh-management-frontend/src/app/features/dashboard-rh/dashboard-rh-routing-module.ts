import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RhDashboard } from './pages/rh-dashboard/rh-dashboard';

const routes: Routes = [
  {
    path: '',
    component: RhDashboard
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRhRoutingModule {}