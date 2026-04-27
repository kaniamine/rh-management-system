import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfilRoutingModule } from './profil-routing-module';
import { Profil } from './pages/profil/profil';

@NgModule({
  imports: [CommonModule, ProfilRoutingModule, Profil]
})
export class ProfilModule {}
