import { Injectable, signal, computed, inject } from '@angular/core';
import {
  InvestmentComponent,
  SEED_INVESTMENTS,
} from '../models/investment.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class InvestmentService {
  private storage = inject(StorageService);

  private _components = signal<InvestmentComponent[]>(this.loadInitial());

  readonly components = this._components.asReadonly();

  readonly activeComponents = computed(() =>
    this._components().filter((c) => c.active)
  );

  readonly totalDefaultMonthly = computed(() =>
    this.activeComponents().reduce((sum, c) => sum + c.defaultMonthlyAmount, 0)
  );

  readonly componentCount = computed(() => this._components().length);
  readonly activeCount = computed(() => this.activeComponents().length);

  private loadInitial(): InvestmentComponent[] {
    const stored = this.storage.get<InvestmentComponent[]>(
      this.storage.getComponentsKey()
    );
    if (stored && stored.length > 0) return stored;
    // Seed initial data
    this.storage.set(this.storage.getComponentsKey(), SEED_INVESTMENTS);
    return [...SEED_INVESTMENTS];
  }

  private persist(): void {
    this.storage.set(this.storage.getComponentsKey(), this._components());
  }

  getById(id: string): InvestmentComponent | undefined {
    return this._components().find((c) => c.id === id);
  }

  add(name: string, defaultMonthlyAmount: number, type: string = ''): InvestmentComponent {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Investment name cannot be empty');
    if (defaultMonthlyAmount < 0) throw new Error('Amount cannot be negative');
    if (this.isDuplicateName(trimmedName))
      throw new Error(`Investment "${trimmedName}" already exists`);

    const component: InvestmentComponent = {
      id: this.generateId(),
      name: trimmedName,
      type: type.trim(),
      defaultMonthlyAmount: Math.round(defaultMonthlyAmount),
      active: true,
      createdAt: new Date().toISOString(),
    };

    this._components.update((list) => [...list, component]);
    this.persist();
    return component;
  }

  update(
    id: string,
    changes: Partial<Pick<InvestmentComponent, 'name' | 'defaultMonthlyAmount' | 'type'>>
  ): void {
    if (changes.name !== undefined) {
      const trimmed = changes.name.trim();
      if (!trimmed) throw new Error('Investment name cannot be empty');
      if (this.isDuplicateName(trimmed, id))
        throw new Error(`Investment "${trimmed}" already exists`);
      changes = { ...changes, name: trimmed };
    }
    if (
      changes.defaultMonthlyAmount !== undefined &&
      changes.defaultMonthlyAmount < 0
    ) {
      throw new Error('Amount cannot be negative');
    }
    if (changes.defaultMonthlyAmount !== undefined) {
      changes = {
        ...changes,
        defaultMonthlyAmount: Math.round(changes.defaultMonthlyAmount),
      };
    }

    this._components.update((list) =>
      list.map((c) => (c.id === id ? { ...c, ...changes } : c))
    );
    this.persist();
  }

  toggleActive(id: string): void {
    this._components.update((list) =>
      list.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
    this.persist();
  }

  deactivate(id: string): void {
    this._components.update((list) =>
      list.map((c) => (c.id === id ? { ...c, active: false } : c))
    );
    this.persist();
  }

  activate(id: string): void {
    this._components.update((list) =>
      list.map((c) => (c.id === id ? { ...c, active: true } : c))
    );
    this.persist();
  }

  delete(id: string): void {
    this._components.update((list) => list.filter((c) => c.id !== id));
    this.persist();
  }

  reload(): void {
    const stored = this.storage.get<InvestmentComponent[]>(
      this.storage.getComponentsKey()
    );
    this._components.set(stored ?? []);
  }

  /** Seed default investments when the current scope has no components. */
  ensureSeed(): void {
    if (this._components().length > 0) return;
    this._components.set([...SEED_INVESTMENTS]);
    this.persist();
  }

  private isDuplicateName(name: string, excludeId?: string): boolean {
    return this._components().some(
      (c) =>
        c.name.toLowerCase() === name.toLowerCase() && c.id !== excludeId
    );
  }

  private generateId(): string {
    return `inv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
}
