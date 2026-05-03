import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { GameProviderService } from '../../shared/services/game-provider.service';
import { DealDetailModalComponent } from '../../shared/components/deal-detail-modal/deal-detail-modal.component';
import { FavoriteGame, Store, Deal } from '../../shared/interfaces/models';

@Component({
  selector: 'app-favorite',
  templateUrl: './favorite.page.html',
  styleUrls: ['./favorite.page.scss'],
  standalone: false
})
export class FavoritePage implements OnInit {

  favorite: FavoriteGame | null = null;
  stores: Store[] = [];
  isLoading = true;

  constructor(
    private gameProvider: GameProviderService,
    private modalCtrl: ModalController
  ) { }

  async ngOnInit() {
    await this.loadFavorite();
  }

  async ionViewWillEnter() {
    await this.loadFavorite();
  }

  async loadFavorite() {
    this.isLoading = true;
    this.favorite = await this.gameProvider.getFavorite();

    if (this.favorite) {
      this.gameProvider.getStores().subscribe(stores => {
        this.stores = stores;
        this.isLoading = false;
      });
    } else {
      this.isLoading = false;
    }
  }

  getStore(storeID: string): Store | undefined {
    return this.gameProvider.getStoreInfo(this.stores, storeID);
  }

  get storeLogoUrl(): string {
    if (!this.favorite) return '';

    const store = this.getStore(this.favorite.storeID);
    return store ? this.gameProvider.getStoreLogoUrl(store) : '';
  }

  get savingsPercent(): string {
    if (!this.favorite) return '';
    return Math.round(parseFloat(this.favorite.savings)) + '%';
  }

  async openDetail() {
    if (!this.favorite) return;

    const deal: Deal = {
      internalName: '',
      title: this.favorite.title,
      metacriticLink: '',
      dealID: this.favorite.dealID,
      storeID: this.favorite.storeID,
      gameID: this.favorite.gameID,
      salePrice: this.favorite.salePrice,
      normalPrice: this.favorite.normalPrice,
      isOnSale: '1',
      savings: this.favorite.savings,
      metacriticScore: '0',
      steamRatingText: '',
      steamRatingPercent: '0',
      steamRatingCount: '0',
      steamAppID: '',
      releaseDate: 0,
      lastChange: 0,
      dealRating: this.favorite.dealRating,
      thumb: this.favorite.thumb
    };

    const modal = await this.modalCtrl.create({
      component: DealDetailModalComponent,
      componentProps: {
        deal,
        store: this.getStore(this.favorite.storeID)
      },
      cssClass: 'bottom-sheet-modal',
      backdropDismiss: true,
      showBackdrop: true
    });

    await modal.present();
  }

  async removeFavorite() {
    await this.gameProvider.removeFavorite();
    this.favorite = null;
  }

  hideBrokenImage(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  parseFloat = parseFloat;
}