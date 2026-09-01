import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { SyncService } from './core/services/sync.service';
import { SyncStatus } from './core/models/sync.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToastComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private sync = inject(SyncService);

  syncState = computed(() => this.sync.syncState());
  migrationOpen = computed(() => !!this.sync.migrationPrompt());

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

  async onUploadLocal(): Promise<void> {
    await this.sync.uploadLocalToCloud();
  }

  async onKeepSeparate(): Promise<void> {
    await this.sync.keepLocalOnly();
  }
}
