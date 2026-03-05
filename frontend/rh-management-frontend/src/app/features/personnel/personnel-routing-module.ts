import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PersonnelList } from './pages/personnel-list/personnel-list';

const routes: Routes = [
  { path: '', component: PersonnelList }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PersonnelRoutingModule {}