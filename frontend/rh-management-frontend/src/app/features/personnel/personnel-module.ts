import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PersonnelRoutingModule } from './personnel-routing-module';
import { PersonnelList } from './pages/personnel-list/personnel-list';

@NgModule({
  imports: [
    CommonModule,
    PersonnelRoutingModule,
    PersonnelList
  ]
})
export class PersonnelModule {}