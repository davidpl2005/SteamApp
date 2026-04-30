import { Component } from '@angular/core';
import { Router } from '@angular/router';

type TabName = 'deals' | 'favorite';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false
})
export class TabsPage {

  constructor(private router: Router) {}

  goTo(tab: TabName) {
    this.router.navigateByUrl(`/tabs/${tab}`);
  }

  isActive(tab: TabName): boolean {
    return this.router.url === `/tabs/${tab}`;
  }
}