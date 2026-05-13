import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsulterDemandes } from './pages/consulter-demandes/consulter-demandes';

const routes: Routes = [
  { path: '', component: ConsulterDemandes }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConsulterDemandesRoutingModule {}
