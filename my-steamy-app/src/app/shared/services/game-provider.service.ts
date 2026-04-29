import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { HttpService } from '../../core/services/http.service';
import { Deal, Store, FavoriteGame, GameDetail } from '../interfaces/models';

const FAVORITE_KEY = 'favoriteGame';
const CHEAPSHARK_IMAGES = 'https://www.cheapshark.com';

@Injectable({
  providedIn: 'root'
})
export class GameProviderService {

  constructor(private http: HttpService) {}

  // ──────────────────── STORES ────────────────────

  getStores(): Observable<Store[]> {
    return this.http.get<Store[]>('/stores');
  }

  // ──────────────────── DEALS ────────────────────

  getTopDeals(): Observable<Deal[]> {
    return this.http.get<Deal[]>('/deals', { pageSize: '5', sortBy: 'DealRating' });
  }

  searchDeals(query: string): Observable<Deal[]> {
    return this.http.get<Deal[]>('/deals', { title: query, pageSize: '20' });
  }

  // ──────────────────── GAME DETAIL ────────────────────

  getGameById(gameID: string): Observable<GameDetail> {
    return this.http.get<GameDetail>('/games', { id: gameID });
  }

  // ──────────────────── COMBINED ────────────────────

  getDealsWithStores(query?: string): Observable<{ deals: Deal[]; stores: Store[] }> {
    const deals$ = query ? this.searchDeals(query) : this.getTopDeals();
    const stores$ = this.getStores();
    return forkJoin({ deals: deals$, stores: stores$ });
  }

  getStoreInfo(stores: Store[], storeID: string): Store | undefined {
    return stores.find(s => s.storeID === storeID);
  }

  getStoreLogoUrl(store: Store): string {
    return `${CHEAPSHARK_IMAGES}${store.images.logo}`;
  }

  // ──────────────────── FAVORITES ────────────────────

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
  }

  async getFavorite(): Promise<FavoriteGame | null> {
    const { value } = await Preferences.get({ key: FAVORITE_KEY });
    return value ? JSON.parse(value) : null;
  }

  async removeFavorite(): Promise<void> {
    await Preferences.remove({ key: FAVORITE_KEY });
  }

  async isFavorite(gameID: string): Promise<boolean> {
    const fav = await this.getFavorite();
    return fav?.gameID === gameID;
  }

  // ──────────────────── REDIRECT URL ────────────────────

  getDealUrl(dealID: string): string {
    return `https://www.cheapshark.com/redirect?dealID=${dealID}`;
  }
}