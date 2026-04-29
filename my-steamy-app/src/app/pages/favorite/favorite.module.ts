import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { FavoritePage } from './favorite.page';

const routes: Routes = [
  { path: '', component: FavoritePage }
];

@NgModule({
  declarations: [FavoritePage],
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class FavoritePageModule {}