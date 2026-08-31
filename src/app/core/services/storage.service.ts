import { Injectable } from '@angular/core';
import { AppData } from '../models/investment.model';

const STORAGE_KEYS = {
  INVESTMENT_COMPONENTS: 'investory_components',
  MONTHLY_INVESTMENTS: 'investory_monthly',
} as const;

@Injectable({ providedIn: 'root' })
export class StorageService {
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

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to write localStorage key: ${key}`, e);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  }

  exportAll(): AppData {
    return {
      version: 1,
      investmentComponents: this.get(STORAGE_KEYS.INVESTMENT_COMPONENTS) ?? [],
      monthlyInvestments: this.get(STORAGE_KEYS.MONTHLY_INVESTMENTS) ?? [],
      exportedAt: new Date().toISOString(),
    };
  }

  importAll(data: AppData): boolean {
    if (!this.validateImport(data)) return false;
    this.set(STORAGE_KEYS.INVESTMENT_COMPONENTS, data.investmentComponents);
    this.set(STORAGE_KEYS.MONTHLY_INVESTMENTS, data.monthlyInvestments);
    return true;
  }

  private validateImport(data: unknown): data is AppData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d['version'] === 'number' &&
      Array.isArray(d['investmentComponents']) &&
      Array.isArray(d['monthlyInvestments'])
    );
  }

  getComponentsKey(): string {
    return STORAGE_KEYS.INVESTMENT_COMPONENTS;
  }

  getMonthlyKey(): string {
    return STORAGE_KEYS.MONTHLY_INVESTMENTS;
  }
}
