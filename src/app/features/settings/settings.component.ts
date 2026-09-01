import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../core/services/storage.service';
import { ToastService } from '../../core/services/toast.service';
import { InvestmentService } from '../../core/services/investment.service';
import { MonthlyService } from '../../core/services/monthly.service';
import { AuthService } from '../../core/services/auth.service';
import { SyncService } from '../../core/services/sync.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SyncStatus } from '../../core/models/sync.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="settings-container fade-in">
      <header class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="subtitle">Manage your application data and preferences</p>
        </div>
      </header>

      <div class="settings-grid">
        <section class="card settings-section">
          <h2 class="card-title">Cloud Account</h2>

          @if (!auth.isAuthenticated()) {
            <div class="auth-form">
              <p class="auth-intro">
                Sign in to sync your investments across devices. Local data stays on
                this browser until you choose to upload it.
              </p>
              <label class="field">
                <span>Email</span>
                <input
                  type="email"
                  [(ngModel)]="email"
                  autocomplete="email"
                  placeholder="you@example.com"
                />
              </label>
              <label class="field">
                <span>Password</span>
                <input
                  type="password"
                  [(ngModel)]="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                />
              </label>
              @if (authError()) {
                <p class="auth-error">{{ authError() }}</p>
              }
              <div class="auth-actions">
                <button
                  class="btn btn-primary"
                  type="button"
                  (click)="signIn()"
                  [disabled]="authBusy()"
                >
                  Sign In
                </button>
                <button
                  class="btn btn-secondary"
                  type="button"
                  (click)="signUp()"
                  [disabled]="authBusy()"
                >
                  Sign Up
                </button>
              </div>
            </div>
          } @else {
            <div class="setting-item">
              <div class="setting-info">
                <h3>Signed in</h3>
                <p>{{ auth.user()?.email }}</p>
              </div>
              <button
                class="btn btn-secondary"
                type="button"
                (click)="signOut()"
                [disabled]="authBusy()"
              >
                Sign Out
              </button>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <h3>Sync status</h3>
                <p>
                  <span class="sync-pill" [attr.data-status]="syncState().status">
                    {{ syncLabel() }}
                  </span>
                  @if (syncState().message) {
                    <span class="sync-message">{{ syncState().message }}</span>
                  }
                </p>
              </div>
            </div>
          }
        </section>

        <section class="card settings-section">
          <h2 class="card-title">Data Management</h2>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Export Data</h3>
              <p>
                Download a complete backup of all your investments and monthly
                records.
              </p>
            </div>
            <button class="btn btn-secondary" type="button" (click)="exportData()">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                style="margin-right: 8px;"
              >
                <path
                  d="M15.5 12.5V14C15.5 14.3978 15.342 14.7794 15.0607 15.0607C14.7794 15.342 14.3978 15.5 14 15.5H4C3.60218 15.5 3.22064 15.342 2.93934 15.0607C2.65795 14.7794 2.5 14.3978 2.5 14V12.5M5.5 9.5L9 13M9 13L12.5 9.5M9 13V2.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Export JSON
            </button>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Import Data</h3>
              <p>
                Restore your data from a previously exported JSON backup file. This
                will replace your current data.
              </p>
            </div>
            <div class="file-input-wrapper">
              <button
                class="btn btn-secondary"
                type="button"
                (click)="fileInput.click()"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  style="margin-right: 8px;"
                >
                  <path
                    d="M15.5 12.5V14C15.5 14.3978 15.342 14.7794 15.0607 15.0607C14.7794 15.342 14.3978 15.5 14 15.5H4C3.60218 15.5 3.22064 15.342 2.93934 15.0607C2.65795 14.7794 2.5 14.3978 2.5 14V12.5M12.5 6.5L9 3M9 3L5.5 6.5M9 3V13.5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Import JSON
              </button>
              <input
                type="file"
                #fileInput
                accept=".json"
                (change)="importData($event)"
                style="display: none;"
              />
            </div>
          </div>

          <div class="setting-item danger-zone">
            <div class="setting-info">
              <h3 class="danger-text">Clear All Data</h3>
              <p>
                Permanently delete all investments and monthly records. This cannot
                be undone.
              </p>
            </div>
            <button
              class="btn btn-danger"
              type="button"
              (click)="showClearConfirm = true"
            >
              Clear Data
            </button>
          </div>
        </section>

        <section class="card settings-section">
          <h2 class="card-title">About Investory</h2>
          <div class="about-content">
            <p>
              A modern, minimalist personal investment tracking application built
              with Angular 19.
            </p>
            <ul class="features-list">
              <li>Local-first architecture — works fully offline</li>
              <li>Optional Supabase cloud sync across devices</li>
              <li>Responsive premium dark theme</li>
              <li>No account required to get started</li>
            </ul>
            <div class="version-info">Version 1.0.0</div>
          </div>
        </section>
      </div>

      <app-confirm-dialog
        [open]="showClearConfirm"
        title="Clear All Data?"
        message="Are you absolutely sure you want to delete all your investment data? This action cannot be undone unless you have a backup."
        confirmText="Yes, delete everything"
        [danger]="true"
        (confirmed)="onClearConfirm()"
        (cancelled)="showClearConfirm = false"
      />
    </div>
  `,
  styles: [
    `
      .settings-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-xl);
        max-width: 800px;
        margin: 0 auto;
      }

      .fade-in {
        animation: fadeIn 400ms ease;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: var(--space-md);
      }

      .page-title {
        font-size: var(--font-2xl);
        font-weight: var(--weight-bold);
        color: var(--text-primary);
        margin-bottom: var(--space-xs);
        letter-spacing: -0.02em;
      }

      .subtitle {
        color: var(--text-secondary);
        font-size: var(--font-base);
      }

      .settings-grid {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
      }

      .card {
        background: var(--bg-surface);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
      }

      .card-title {
        font-size: var(--font-lg);
        font-weight: var(--weight-semibold);
        color: var(--text-primary);
        margin-bottom: var(--space-xl);
        padding-bottom: var(--space-md);
        border-bottom: 1px solid var(--border-primary);
      }

      .auth-intro {
        font-size: var(--font-sm);
        color: var(--text-secondary);
        margin-bottom: var(--space-lg);
        line-height: 1.5;
      }

      .auth-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);

        span {
          font-size: var(--font-sm);
          color: var(--text-secondary);
          font-weight: var(--weight-medium);
        }

        input {
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          padding: var(--space-sm) var(--space-md);
          color: var(--text-primary);
          font-size: var(--font-base);

          &:focus {
            outline: none;
            border-color: var(--accent);
          }
        }
      }

      .auth-actions {
        display: flex;
        gap: var(--space-sm);
        flex-wrap: wrap;
        margin-top: var(--space-sm);
      }

      .auth-error {
        color: var(--error);
        font-size: var(--font-sm);
        margin: 0;
      }

      .sync-pill {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: var(--font-xs);
        font-weight: var(--weight-medium);
        background: var(--bg-elevated);
        color: var(--text-secondary);
        margin-right: var(--space-sm);

        &[data-status='synced'] {
          color: var(--success, #22c55e);
          background: color-mix(in srgb, var(--success, #22c55e) 15%, transparent);
        }
        &[data-status='syncing'] {
          color: var(--accent-text);
          background: var(--accent-subtle);
        }
        &[data-status='offline'] {
          color: var(--warning, #f59e0b);
        }
        &[data-status='error'] {
          color: var(--error);
          background: var(--error-subtle);
        }
      }

      .sync-message {
        font-size: var(--font-sm);
        color: var(--text-tertiary);
      }

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: var(--space-lg) 0;
        border-bottom: 1px solid var(--border-primary);
        gap: var(--space-lg);

        &:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        &.danger-zone {
          margin-top: var(--space-md);
          padding-top: var(--space-lg);
          border-top: 1px dashed var(--error);
        }
      }

      .setting-info {
        flex: 1;

        h3 {
          font-size: var(--font-md);
          font-weight: var(--weight-medium);
          color: var(--text-primary);
          margin-bottom: var(--space-xs);
        }

        p {
          font-size: var(--font-sm);
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .danger-text {
          color: var(--error);
        }
      }

      .btn {
        padding: var(--space-sm) var(--space-lg);
        border-radius: var(--radius-md);
        font-size: var(--font-sm);
        font-weight: var(--weight-medium);
        transition: all var(--transition-fast);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        white-space: nowrap;

        &:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        &.btn-primary {
          background: var(--accent);
          color: white;
          border: 1px solid transparent;

          &:hover:not(:disabled) {
            background: var(--accent-hover);
          }
        }

        &.btn-secondary {
          background: var(--bg-surface-hover);
          color: var(--text-primary);
          border: 1px solid var(--border-primary);

          &:hover:not(:disabled) {
            background: var(--bg-elevated);
            border-color: var(--border-secondary);
          }
        }

        &.btn-danger {
          background: var(--error-subtle);
          color: var(--error);
          border: 1px solid transparent;

          &:hover {
            background: var(--error);
            color: white;
          }
        }
      }

      .about-content {
        color: var(--text-secondary);
        font-size: var(--font-base);
        line-height: 1.6;

        .features-list {
          margin: var(--space-md) 0 var(--space-lg) var(--space-lg);

          li {
            margin-bottom: var(--space-xs);
          }
        }

        .version-info {
          display: inline-block;
          padding: var(--space-xs) var(--space-sm);
          background: var(--bg-elevated);
          border-radius: var(--radius-sm);
          font-size: var(--font-xs);
          font-family: monospace;
          color: var(--text-tertiary);
        }
      }

      @media (max-width: 640px) {
        .setting-item {
          flex-direction: column;
          align-items: flex-start;

          .btn {
            margin-top: var(--space-sm);
          }
        }
      }
    `,
  ],
})
export class SettingsComponent {
  private storage = inject(StorageService);
  private invService = inject(InvestmentService);
  private monthlyService = inject(MonthlyService);
  private toast = inject(ToastService);
  readonly auth = inject(AuthService);
  readonly sync = inject(SyncService);

  showClearConfirm = false;
  email = '';
  password = '';
  authBusy = signal(false);
  authError = signal<string | null>(null);

  syncState = computed(() => this.sync.syncState());

  syncLabel = computed(() => {
    const labels: Record<SyncStatus, string> = {
      synced: 'Synced',
      syncing: 'Syncing',
      offline: 'Offline',
      error: 'Error',
      not_logged_in: 'Not logged in',
    };
    return labels[this.syncState().status];
  });

  async signIn(): Promise<void> {
    this.authError.set(null);
    if (!this.email.trim() || !this.password) {
      this.authError.set('Email and password are required.');
      return;
    }
    this.authBusy.set(true);
    try {
      const { error } = await this.auth.signIn(this.email, this.password);
      if (error) {
        this.authError.set(error);
      } else {
        this.password = '';
        this.toast.success('Signed in');
      }
    } finally {
      this.authBusy.set(false);
    }
  }

  async signUp(): Promise<void> {
    this.authError.set(null);
    if (!this.email.trim() || !this.password) {
      this.authError.set('Email and password are required.');
      return;
    }
    this.authBusy.set(true);
    try {
      const { error } = await this.auth.signUp(this.email, this.password);
      if (error) {
        this.authError.set(error);
      } else {
        this.password = '';
        this.toast.success('Account created — check your email if confirmation is required');
      }
    } finally {
      this.authBusy.set(false);
    }
  }

  async signOut(): Promise<void> {
    this.authBusy.set(true);
    try {
      const { error } = await this.auth.signOut();
      if (error) {
        this.toast.error(error);
      } else {
        this.toast.info('Signed out');
      }
    } finally {
      this.authBusy.set(false);
    }
  }

  exportData(): void {
    try {
      const data = this.storage.exportAll();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `investory-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.toast.success('Data exported successfully');
    } catch (e) {
      this.toast.error('Failed to export data');
      console.error(e);
    }
  }

  importData(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        const success = this.storage.importAll(data);
        if (success) {
          this.invService.reload();
          this.monthlyService.reload();
          this.toast.success('Data imported successfully');
        } else {
          this.toast.error('Invalid backup file format');
        }
      } catch (err) {
        this.toast.error('Failed to parse backup file');
        console.error(err);
      }

      input.value = '';
    };

    reader.onerror = () => {
      this.toast.error('Failed to read file');
      input.value = '';
    };

    reader.readAsText(file);
  }

  async onClearConfirm(): Promise<void> {
    try {
      if (this.auth.isAuthenticated()) {
        await this.sync.clearCloudAndLocal();
      } else {
        this.storage.clearAll();
        this.invService.reload();
        this.monthlyService.reload();
      }
      this.toast.success('All data has been cleared');
    } catch (e) {
      this.toast.error('Failed to clear data');
      console.error(e);
    } finally {
      this.showClearConfirm = false;
    }
  }
}
