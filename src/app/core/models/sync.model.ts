export type SyncStatus =
  | 'synced'
  | 'syncing'
  | 'offline'
  | 'error'
  | 'not_logged_in';

export interface SyncState {
  status: SyncStatus;
  message: string;
  lastSyncedAt: string | null;
}

export interface MigrationPrompt {
  localHasData: boolean;
  cloudHasData: boolean;
  localUpdatedAt: string | null;
  cloudUpdatedAt: string | null;
}
