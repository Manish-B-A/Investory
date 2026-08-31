import { Injectable, signal, inject } from '@angular/core';
import {
  MonthlyInvestment,
  MonthlyInvestmentEntry,
} from '../models/investment.model';
import { StorageService } from './storage.service';
import { InvestmentService } from './investment.service';

@Injectable({ providedIn: 'root' })
export class MonthlyService {
  private storage = inject(StorageService);
  private investmentService = inject(InvestmentService);

  private _records = signal<MonthlyInvestment[]>(this.loadInitial());

  readonly records = this._records.asReadonly();

  private loadInitial(): MonthlyInvestment[] {
    const stored = this.storage.get<MonthlyInvestment[]>(
      this.storage.getMonthlyKey()
    );
    return stored ?? [];
  }

  private persist(): void {
    this.storage.set(this.storage.getMonthlyKey(), this._records());
  }

  getMonth(month: string): MonthlyInvestment | undefined {
    return this._records().find((r) => r.month === month);
  }

  getOrCreateMonth(month: string): MonthlyInvestment {
    const existing = this.getMonth(month);
    if (existing) return existing;

    const activeComponents = this.investmentService.activeComponents();
    const record: MonthlyInvestment = {
      id: `month-${month}`,
      month,
      investments: activeComponents.map((c) => ({
        investmentId: c.id,
        plannedAmount: c.defaultMonthlyAmount,
        actualAmount: null,
        invested: false,
      })),
    };

    return record;
  }

  updateEntry(
    month: string,
    investmentId: string,
    changes: Partial<Pick<MonthlyInvestmentEntry, 'plannedAmount' | 'actualAmount' | 'invested'>>
  ): void {
    if (
      changes.plannedAmount !== undefined &&
      changes.plannedAmount < 0
    ) {
      throw new Error('Planned amount cannot be negative');
    }
    if (
      changes.actualAmount !== undefined &&
      changes.actualAmount !== null &&
      changes.actualAmount < 0
    ) {
      throw new Error('Actual amount cannot be negative');
    }

    // Round currency values
    if (changes.plannedAmount !== undefined) {
      changes = { ...changes, plannedAmount: Math.round(changes.plannedAmount) };
    }
    if (changes.actualAmount !== undefined && changes.actualAmount !== null) {
      changes = { ...changes, actualAmount: Math.round(changes.actualAmount) };
    }

    this._records.update((list) => {
      let currentList = list;
      if (!currentList.some(r => r.month === month)) {
        const newRecord = this.getOrCreateMonth(month);
        currentList = [...currentList, newRecord];
      }

      const updatedList = currentList.map((r) => {
        if (r.month !== month) return r;
        return {
          ...r,
          investments: r.investments.map((inv) =>
            inv.investmentId === investmentId ? { ...inv, ...changes } : inv
          ),
        };
      });

      return updatedList.filter(r => 
        r.investments.some(inv => inv.invested || inv.actualAmount !== null)
      );
    });
    this.persist();
  }

  addEntryToMonth(month: string, investmentId: string, plannedAmount: number): void {
    const record = this.getMonth(month);
    if (!record) return;

    const exists = record.investments.some((i) => i.investmentId === investmentId);
    if (exists) return;

    const entry: MonthlyInvestmentEntry = {
      investmentId,
      plannedAmount: Math.round(plannedAmount),
      actualAmount: null,
      invested: false,
    };

    this._records.update((list) =>
      list.map((r) => {
        if (r.month !== month) return r;
        return { ...r, investments: [...r.investments, entry] };
      })
    );
    this.persist();
  }

  removeEntryFromMonth(month: string, investmentId: string): void {
    this._records.update((list) =>
      list.map((r) => {
        if (r.month !== month) return r;
        return {
          ...r,
          investments: r.investments.filter(
            (i) => i.investmentId !== investmentId
          ),
        };
      })
    );
    this.persist();
  }

  getRecordedMonths(): string[] {
    return this._records()
      .map((r) => r.month)
      .sort();
  }

  getMonthsInRange(from: string, to: string): MonthlyInvestment[] {
    return this._records()
      .filter((r) => r.month >= from && r.month <= to)
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  hasRecordsForInvestment(investmentId: string): boolean {
    return this._records().some((r) =>
      r.investments.some(
        (i) =>
          i.investmentId === investmentId &&
          (i.actualAmount !== null || i.invested)
      )
    );
  }

  hasAnyRecordsForInvestment(investmentId: string): boolean {
    return this._records().some((r) =>
      r.investments.some((i) => i.investmentId === investmentId)
    );
  }

  reload(): void {
    const stored = this.storage.get<MonthlyInvestment[]>(
      this.storage.getMonthlyKey()
    );
    this._records.set(stored ?? []);
  }
}
