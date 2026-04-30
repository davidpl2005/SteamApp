import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { GameProviderService } from '../../shared/services/game-provider.service';
import { DealDetailModalComponent } from '../../shared/components/deal-detail-modal/deal-detail-modal.component';
import { Deal, Store } from '../../shared/interfaces/models';

@Component({
  selector: 'app-deals',
  templateUrl: './deals.page.html',
  styleUrls: ['./deals.page.scss'],
  standalone: false
})
export class DealsPage implements OnInit, OnDestroy {

  topDeals: Deal[] = [];
  searchResults: Deal[] = [];
  stores: Store[] = [];
  isLoading = true;
  isSearching = false;
  searchQuery = '';
  private destroy$ = new Subject<void>();

  constructor(
    private gameProvider: GameProviderService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.loadTopDeals();
  }

  loadTopDeals() {
    this.isLoading = true;
    this.gameProvider.getDealsWithStores().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ deals, stores }) => {
        this.topDeals = deals;
        this.stores = stores;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onSearchChange(query: string) {
    this.searchQuery = query;

    if (!query) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }

    this.isSearching = true;
    this.isLoading = true;

    this.gameProvider.getDealsWithStores(query).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ deals, stores }) => {
        this.searchResults = deals;
        this.stores = stores;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.searchResults = [];
      }
    });
  }

  getStore(storeID: string): Store | undefined {
    return this.gameProvider.getStoreInfo(this.stores, storeID);
  }

  async openModal(deal: Deal) {
    const modal = await this.modalCtrl.create({
      component: DealDetailModalComponent,
      componentProps: {
        deal,
        store: this.getStore(deal.storeID)
      },
      cssClass: 'bottom-sheet-modal',
      backdropDismiss: true,
      showBackdrop: true
    });

    await modal.present();
  }

  async onFavoriteToggle(deal: Deal) {
    const store = this.getStore(deal.storeID);
    const isFav = await this.gameProvider.isFavorite(deal.gameID);

    if (isFav) {
      await this.gameProvider.removeFavorite();
    } else if (store) {
      await this.gameProvider.saveFavorite(deal, store);
    }
  }

  get skeletonItems() {
    return Array(5).fill(0);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}