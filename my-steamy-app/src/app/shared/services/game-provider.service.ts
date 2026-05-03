import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { HttpService } from '../../core/services/http.service';
import { Deal, Store, FavoriteGame, GameDetail } from '../interfaces/models';
import { Widget } from './widget.plugin';

const FAVORITE_KEY = 'favoriteGame';
const CHEAPSHARK_BASE_URL = 'https://www.cheapshark.com';

@Injectable({
  providedIn: 'root'
})
export class GameProviderService {

  constructor(private http: HttpService) {}

  getStores(): Observable<Store[]> {
    return this.http.get<Store[]>('/stores');
  }

  getTopDeals(): Observable<Deal[]> {
    return this.http.get<Deal[]>('/deals', {
      pageSize: '12',
      sortBy: 'Savings'
    });
  }

  searchDeals(query: string): Observable<Deal[]> {
    return this.http.get<Deal[]>('/deals', {
      title: query,
      pageSize: '20'
    });
  }

  getGameById(gameID: string): Observable<GameDetail> {
    return this.http.get<GameDetail>('/games', { id: gameID });
  }

  getDealsWithStores(query?: string): Observable<{ deals: Deal[]; stores: Store[] }> {
    return forkJoin({
      deals: query ? this.searchDeals(query) : this.getTopDeals(),
      stores: this.getStores()
    });
  }

  getStoreInfo(stores: Store[], storeID: string): Store | undefined {
    return stores.find(store => store.storeID === storeID);
  }

  getStoreLogoUrl(store: Store): string {
    const image = store.images.logo || store.images.icon || store.images.banner;

    if (!image) return '';

    return image.startsWith('http')
      ? image
      : `${CHEAPSHARK_BASE_URL}${image}`;
  }

  async saveFavorite(deal: Deal, store: Store): Promise<void> {
    const favorite: FavoriteGame = {
      gameID: deal.gameID,
      title: deal.title,
      thumb: deal.thumb,
      storeID: deal.storeID,
      storeName: store.storeName,
      salePrice: deal.salePrice,
      normalPrice: deal.normalPrice,
      savings: deal.savings,
      dealRating: deal.dealRating,
      dealID: deal.dealID
    };

    await Preferences.set({
      key: FAVORITE_KEY,
      value: JSON.stringify(favorite)
    });

    await this.updateAndroidWidget();
  }

  async getFavorite(): Promise<FavoriteGame | null> {
    const { value } = await Preferences.get({ key: FAVORITE_KEY });
    return value ? JSON.parse(value) : null;
  }

  async removeFavorite(): Promise<void> {
    await Preferences.remove({ key: FAVORITE_KEY });
    await this.updateAndroidWidget();
  }

  async isFavorite(gameID: string): Promise<boolean> {
    const favorite = await this.getFavorite();
    return favorite?.gameID === gameID;
  }

  getDealUrl(dealID: string): string {
    return `https://www.cheapshark.com/redirect?dealID=${dealID}`;
  }

  private async updateAndroidWidget(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') return;

    try {
      await Widget.updateWidget();
    } catch (error) {
      console.warn('Widget update failed', error);
    }
  }
}