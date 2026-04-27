import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Profil } from './pages/profil/profil';

const routes: Routes = [{ path: '', component: Profil }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfilRoutingModule {}
