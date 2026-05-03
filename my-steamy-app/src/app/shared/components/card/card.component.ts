import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Deal, Store } from '../../interfaces/models';
import { GameProviderService } from '../../services/game-provider.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  standalone: false
})
export class CardComponent implements OnInit {
  @Input() deal!: Deal;
  @Input() store?: Store;
  @Input() compact = false;

  @Output() cardClick = new EventEmitter<Deal>();
  @Output() favoriteToggle = new EventEmitter<Deal>();

  isFav = false;

  constructor(private gameProvider: GameProviderService) {}

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

  hideBrokenImage(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  onCardClick() {
    this.cardClick.emit(this.deal);
  }

  async onFavoriteClick(event: Event) {
    event.stopPropagation();
    this.favoriteToggle.emit(this.deal);
    this.isFav = !this.isFav;
  }
}