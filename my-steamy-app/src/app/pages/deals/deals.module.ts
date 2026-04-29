import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DealsPage } from './deals.page';

const routes: Routes = [
  { path: '', component: DealsPage }
];

@NgModule({
  declarations: [DealsPage],
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class DealsPageModule {}