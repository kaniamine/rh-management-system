import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeDashboard } from './pages/employee-dashboard/employee-dashboard';

const routes: Routes = [
  {
    path: '',
    component: EmployeeDashboard
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardEmployeeRoutingModule {}