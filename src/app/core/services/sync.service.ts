import { Injectable, inject, signal, computed, effect, NgZone } from '@angular/core';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { InvestmentRepository } from './investment.repository';
import { InvestmentService } from './investment.service';
import { MonthlyService } from './monthly.service';
import { ToastService } from './toast.service';
import { AppData } from '../models/investment.model';
import { MigrationPrompt, SyncState, SyncStatus } from '../models/sync.model';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private auth = inject(AuthService);
  private storage = inject(StorageService);
  private repo = inject(InvestmentRepository);
  private invService = inject(InvestmentService);
  private monthlyService = inject(MonthlyService);
  private toast = inject(ToastService);
  private zone = inject(NgZone);

  private _status = signal<SyncStatus>('not_logged_in');
  private _message = signal('');
  private _lastSyncedAt = signal<string | null>(null);
  private _migrationPrompt = signal<MigrationPrompt | null>(null);
  private _ready = signal(false);

  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private pushing = false;
  private lastHandledUserId: string | null | undefined = undefined;

  readonly syncState = computed<SyncState>(() => ({
    status: this._status(),
    message: this._message(),
    lastSyncedAt: this._lastSyncedAt(),
  }));

  readonly migrationPrompt = this._migrationPrompt.asReadonly();
  readonly ready = this._ready.asReadonly();

  constructor() {
    this.storage.onDataChanged(() => this.schedulePush());

    effect(() => {
      const initialized = this.auth.initialized();
      const user = this.auth.user();
      if (!initialized) return;

      const userId = user?.id ?? null;
      if (this.lastHandledUserId === userId) return;
      const previous = this.lastHandledUserId;
      this.lastHandledUserId = userId;

      queueMicrotask(() => {
        void this.handleAuthChange(userId, previous);
      });
    });
  }

  async init(): Promise<void> {
    await this.auth.init();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.onOnline());
      window.addEventListener('offline', () => this.onOffline());
      if (!navigator.onLine) {
        this._status.set(
          this.auth.isAuthenticated() ? 'offline' : 'not_logged_in'
        );
        this._message.set('You are offline. Local data is still available.');
      }
    }

    this._ready.set(true);
  }

  private async handleAuthChange(
    userId: string | null,
    previous: string | null | undefined
  ): Promise<void> {
    if (previous && previous !== userId) {
      this.storage.clearCurrentUserCache();
    }

    if (!userId) {
      this.storage.setUserScope(null);
      this.invService.reload();
      this.monthlyService.reload();
      this._status.set('not_logged_in');
      this._message.set('');
      this._migrationPrompt.set(null);
      return;
    }

    this.storage.setUserScope(userId);

    const cached = this.storage.exportAll();
    if (
      cached.investmentComponents.length > 0 ||
      cached.monthlyInvestments.length > 0
    ) {
      this.invService.reload();
      this.monthlyService.reload();
    }

    if (!navigator.onLine) {
      this._status.set('offline');
      this._message.set('Offline — showing cached data');
      return;
    }

    await this.pullAndReconcile(userId);
  }

  private async pullAndReconcile(userId: string): Promise<void> {
    this._status.set('syncing');
    this._message.set('Syncing...');

    try {
      const { data: cloud, error } = await this.repo.fetchAll(userId);
      if (error) {
        this._status.set('error');
        this._message.set(
          'Unable to sync. Your local data is safe and we will retry.'
        );
        return;
      }

      const cloudHasData =
        !!cloud &&
        (cloud.investmentComponents.length > 0 ||
          cloud.monthlyInvestments.length > 0);

      const localUserData = this.storage.exportAll();
      const localUserHasData =
        localUserData.investmentComponents.length > 0 ||
        localUserData.monthlyInvestments.length > 0;

      const guestHasData = this.storage.guestHasMeaningfulData();

      if (!cloudHasData && guestHasData && !localUserHasData) {
        this._migrationPrompt.set({
          localHasData: true,
          cloudHasData: false,
          localUpdatedAt: this.storage.exportGuestData().updatedAt ?? null,
          cloudUpdatedAt: null,
        });
        this._status.set('synced');
        this._message.set('Local data found — choose how to continue');
        this.invService.reload();
        this.monthlyService.reload();
        return;
      }

      if (!cloudHasData && localUserHasData) {
        await this.pushNow();
        return;
      }

      if (cloudHasData) {
        const cloudUpdated = cloud!.updatedAt ?? '';
        const localUpdated = this.storage.getUpdatedAt() ?? '';

        if (
          localUserHasData &&
          localUpdated &&
          cloudUpdated &&
          localUpdated > cloudUpdated &&
          this.storage.hasPendingSync()
        ) {
          await this.pushNow();
          return;
        }

        this.storage.writeAppData(cloud!, false);
        this.storage.setPendingSync(false);
        this.invService.reload();
        this.monthlyService.reload();
        this._lastSyncedAt.set(cloud!.updatedAt ?? new Date().toISOString());
        this._status.set('synced');
        this._message.set('Synced');
        return;
      }

      this.invService.reload();
      this.monthlyService.reload();
      if (this.invService.components().length === 0) {
        this.invService.ensureSeed();
      }
      await this.pushNow();
    } catch (e) {
      console.error(e);
      this._status.set('error');
      this._message.set(
        'Unable to sync. Your local data is safe and we will retry.'
      );
    }
  }

  async uploadLocalToCloud(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const guest = this.storage.exportGuestData();
    const payload: AppData = {
      ...guest,
      updatedAt: new Date().toISOString(),
    };
    this.storage.writeAppData(payload, false);
    this.invService.reload();
    this.monthlyService.reload();
    this._migrationPrompt.set(null);
    await this.pushNow();
    this.toast.success('Local data uploaded to your account');
  }

  async keepLocalOnly(): Promise<void> {
    this._migrationPrompt.set(null);
    this.invService.ensureSeed();
    this.monthlyService.reload();
    await this.pushNow();
    this.toast.info(
      'Keeping local device data separate. Cloud account uses defaults.'
    );
  }

  schedulePush(): void {
    if (!this.auth.isAuthenticated()) return;
    if (!navigator.onLine) {
      this.storage.setPendingSync(true);
      this._status.set('offline');
      this._message.set('Offline — changes saved locally');
      return;
    }

    this.storage.setPendingSync(true);
    this._status.set('syncing');
    this._message.set('Syncing...');

    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => {
      void this.pushNow();
    }, 600);
  }

  async pushNow(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId || this.pushing) return;

    if (!navigator.onLine) {
      this.storage.setPendingSync(true);
      this._status.set('offline');
      this._message.set('Offline — changes saved locally');
      return;
    }

    this.pushing = true;
    this._status.set('syncing');
    this._message.set('Syncing...');

    try {
      const data = this.storage.exportAll();
      data.updatedAt = new Date().toISOString();
      this.storage.touchUpdatedAt(data.updatedAt);

      const { error } = await this.repo.replaceAll(userId, data);
      if (error) {
        this.storage.setPendingSync(true);
        this._status.set('error');
        this._message.set(
          'Sync failed. Your local data is safe. We will retry automatically.'
        );
        return;
      }

      this.storage.setPendingSync(false);
      this._lastSyncedAt.set(data.updatedAt);
      this._status.set('synced');
      this._message.set('Synced');
    } catch (e) {
      console.error(e);
      this.storage.setPendingSync(true);
      this._status.set('error');
      this._message.set(
        'Sync failed. Your local data is safe. We will retry automatically.'
      );
    } finally {
      this.pushing = false;
    }
  }

  async clearCloudAndLocal(): Promise<void> {
    const userId = this.auth.user()?.id;
    this.storage.clearAll();
    if (userId) {
      await this.repo.clearAll(userId);
    }
    this.invService.reload();
    this.monthlyService.reload();
  }

  private onOnline(): void {
    this.zone.run(() => {
      if (!this.auth.isAuthenticated()) {
        this._status.set('not_logged_in');
        return;
      }
      if (this.storage.hasPendingSync()) {
        void this.pushNow();
      } else {
        const userId = this.auth.user()?.id;
        if (userId) void this.pullAndReconcile(userId);
      }
    });
  }

  private onOffline(): void {
    this.zone.run(() => {
      if (!this.auth.isAuthenticated()) return;
      this._status.set('offline');
      this._message.set('Offline — changes saved locally');
    });
  }
}
