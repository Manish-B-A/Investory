import { Injectable } from '@angular/core';
import {
  AppData,
  InvestmentComponent,
  MonthlyInvestment,
} from '../models/investment.model';

const GUEST = {
  COMPONENTS: 'investory_components',
  MONTHLY: 'investory_monthly',
  UPDATED_AT: 'investory_updated_at',
} as const;

@Injectable({ providedIn: 'root' })
export class StorageService {
  private userId: string | null = null;
  private changeCallbacks: Array<() => void> = [];

  onDataChanged(callback: () => void): void {
    this.changeCallbacks.push(callback);
  }

  setUserScope(userId: string | null): void {
    this.userId = userId;
  }

  getUserScope(): string | null {
    return this.userId;
  }

  getComponentsKey(): string {
    return this.scoped('components', GUEST.COMPONENTS);
  }

  getMonthlyKey(): string {
    return this.scoped('monthly', GUEST.MONTHLY);
  }

  private updatedAtKey(): string {
    return this.scoped('updated_at', GUEST.UPDATED_AT);
  }

  private pendingKey(): string {
    return this.userId
      ? `investory_user_${this.userId}_pending_sync`
      : 'investory_pending_sync';
  }

  private scoped(suffix: string, guestKey: string): string {
    return this.userId ? `investory_user_${this.userId}_${suffix}` : guestKey;
  }

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      console.error(`Failed to parse localStorage key: ${key}`);
      return null;
    }
  }

  set<T>(key: string, value: T, notify = true): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      if (
        notify &&
        (key === this.getComponentsKey() || key === this.getMonthlyKey())
      ) {
        this.touchUpdatedAt();
        this.emitChange();
      }
    } catch (e) {
      console.error(`Failed to write localStorage key: ${key}`, e);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clearAll(): void {
    localStorage.removeItem(this.getComponentsKey());
    localStorage.removeItem(this.getMonthlyKey());
    localStorage.removeItem(this.updatedAtKey());
    localStorage.removeItem(this.pendingKey());
    this.emitChange();
  }

  clearCurrentUserCache(): void {
    if (!this.userId) return;
    const uid = this.userId;
    localStorage.removeItem(`investory_user_${uid}_components`);
    localStorage.removeItem(`investory_user_${uid}_monthly`);
    localStorage.removeItem(`investory_user_${uid}_updated_at`);
    localStorage.removeItem(`investory_user_${uid}_pending_sync`);
  }

  getUpdatedAt(): string | null {
    return this.get<string>(this.updatedAtKey());
  }

  touchUpdatedAt(iso?: string): void {
    localStorage.setItem(
      this.updatedAtKey(),
      JSON.stringify(iso ?? new Date().toISOString())
    );
  }

  setPendingSync(pending: boolean): void {
    if (pending) localStorage.setItem(this.pendingKey(), 'true');
    else localStorage.removeItem(this.pendingKey());
  }

  hasPendingSync(): boolean {
    return localStorage.getItem(this.pendingKey()) === 'true';
  }

  exportAll(): AppData {
    return {
      version: 1,
      investmentComponents: this.get(this.getComponentsKey()) ?? [],
      monthlyInvestments: this.get(this.getMonthlyKey()) ?? [],
      exportedAt: new Date().toISOString(),
      updatedAt: this.getUpdatedAt() ?? new Date().toISOString(),
    };
  }

  exportGuestData(): AppData {
    return {
      version: 1,
      investmentComponents: this.get<InvestmentComponent[]>(GUEST.COMPONENTS) ?? [],
      monthlyInvestments: this.get<MonthlyInvestment[]>(GUEST.MONTHLY) ?? [],
      exportedAt: new Date().toISOString(),
      updatedAt: this.get<string>(GUEST.UPDATED_AT) ?? undefined,
    };
  }

  guestHasMeaningfulData(): boolean {
    const components = this.get<InvestmentComponent[]>(GUEST.COMPONENTS) ?? [];
    const monthly = this.get<MonthlyInvestment[]>(GUEST.MONTHLY) ?? [];
    const hasCustom = components.some(
      (c) => !['ppf-001', 'sip-001', 'gold-001'].includes(c.id)
    );
    const hasActivity = monthly.some((m) =>
      m.investments.some((e) => e.invested || e.actualAmount !== null)
    );
    return hasCustom || hasActivity || monthly.length > 0;
  }

  importAll(data: AppData, notify = true): boolean {
    if (!this.isValidAppData(data)) return false;
    this.writeAppData(data, notify);
    return true;
  }

  writeAppData(data: AppData, notify = false): void {
    this.set(this.getComponentsKey(), data.investmentComponents, false);
    this.set(this.getMonthlyKey(), data.monthlyInvestments, false);
    this.touchUpdatedAt(data.updatedAt ?? new Date().toISOString());
    if (notify) this.emitChange();
  }

  private isValidAppData(data: unknown): data is AppData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d['version'] === 'number' &&
      Array.isArray(d['investmentComponents']) &&
      Array.isArray(d['monthlyInvestments'])
    );
  }

  private emitChange(): void {
    for (const cb of this.changeCallbacks) {
      try {
        cb();
      } catch (e) {
        console.error('Storage change callback failed', e);
      }
    }
  }
}
