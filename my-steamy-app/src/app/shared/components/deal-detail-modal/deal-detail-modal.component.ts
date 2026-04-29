import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { Deal, Store } from '../../interfaces/models';
import { GameProviderService } from '../../services/game-provider.service';

@Component({
  selector: 'app-deal-detail-modal',
  templateUrl: './deal-detail-modal.component.html',
  styleUrls: ['./deal-detail-modal.component.scss'],
  standalone: false
})
export class DealDetailModalComponent implements OnInit {
  @Input() deal!: Deal;
  @Input() store?: Store;

  isFav = false;
  isTogglingFav = false;

  constructor(
    private modalCtrl: ModalController,
    private gameProvider: GameProviderService
  ) {}

  async ngOnInit() {
    this.isFav = await this.gameProvider.isFavorite(this.deal.gameID);
  }

  get storeLogoUrl(): string {
    return this.store ? this.gameProvider.getStoreLogoUrl(this.store) : '';
  }

  get savingsPercent(): string {
    return Math.round(parseFloat(this.deal.savings)) + '%';
  }

  get dealRating(): string {
    return parseFloat(this.deal.dealRating).toFixed(1);
  }

  async viewDeal() {
    const url = this.gameProvider.getDealUrl(this.deal.dealID);
    await Browser.open({ url });
  }

  async toggleFavorite() {
    if (this.isTogglingFav) return;
    this.isTogglingFav = true;
    try {
      if (this.isFav) {
        await this.gameProvider.removeFavorite();
        this.isFav = false;
      } else if (this.store) {
        await this.gameProvider.saveFavorite(this.deal, this.store);
        this.isFav = true;
      }
    } finally {
      this.isTogglingFav = false;
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}