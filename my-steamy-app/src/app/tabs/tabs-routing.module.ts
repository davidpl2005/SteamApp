import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'deals',
        loadChildren: () =>
          import('../pages/deals/deals.module').then(m => m.DealsPageModule)
      },
      {
        path: 'favorite',
        loadChildren: () =>
          import('../pages/favorite/favorite.module').then(m => m.FavoritePageModule)
      },
      {
        path: '',
        redirectTo: 'deals',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsRoutingModule {}
