import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open) {
      <div class="dialog-backdrop" (click)="onCancel()" role="presentation"></div>
      <div class="dialog" role="alertdialog" [attr.aria-labelledby]="'dialog-title'" [attr.aria-describedby]="'dialog-desc'">
        <h3 class="dialog-title" id="dialog-title">{{ title }}</h3>
        <p class="dialog-message" id="dialog-desc">{{ message }}</p>
        <div class="dialog-actions">
          <button class="btn btn-secondary" (click)="onCancel()">{{ cancelText }}</button>
          <button class="btn" [class.btn-danger]="danger" [class.btn-primary]="!danger" (click)="onConfirm()">{{ confirmText }}</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 9998;
      animation: fadeIn 150ms ease;
    }

    .dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-elevated);
      border: 1px solid var(--border-secondary);
      border-radius: var(--radius-lg);
      padding: var(--space-xl);
      z-index: 9999;
      min-width: 360px;
      max-width: 480px;
      box-shadow: var(--shadow-lg);
      animation: scaleIn 200ms ease;
    }

    .dialog-title {
      font-size: var(--font-lg);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
      margin-bottom: var(--space-sm);
    }

    .dialog-message {
      font-size: var(--font-base);
      color: var(--text-secondary);
      margin-bottom: var(--space-xl);
      line-height: 1.5;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-sm);
    }

    .btn {
      padding: var(--space-sm) var(--space-lg);
      border-radius: var(--radius-md);
      font-size: var(--font-sm);
      font-weight: var(--weight-medium);
      transition: all var(--transition-fast);
      cursor: pointer;
    }

    .btn-secondary {
      background: var(--bg-surface);
      border: 1px solid var(--border-primary);
      color: var(--text-secondary);

      &:hover {
        background: var(--bg-surface-hover);
        color: var(--text-primary);
      }
    }

    .btn-primary {
      background: var(--accent);
      color: white;

      &:hover {
        background: var(--accent-hover);
      }
    }

    .btn-danger {
      background: var(--error);
      color: white;

      &:hover {
        background: #dc2626;
      }
    }
  `],
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() danger = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
