import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast-{{ toast.type }}" role="alert">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M6 9L8 11L12 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              }
              @case ('error') {
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M6.5 6.5L11.5 11.5M11.5 6.5L6.5 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              }
              @case ('warning') {
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L16.5 15H1.5L9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                  <line x1="9" y1="7" x2="9" y2="10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <circle cx="9" cy="13" r="0.75" fill="currentColor"/>
                </svg>
              }
              @default {
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/>
                  <line x1="9" y1="8" x2="9" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <circle cx="9" cy="5.5" r="0.75" fill="currentColor"/>
                </svg>
              }
            }
          </div>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-dismiss" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss notification">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: var(--space-lg);
      right: var(--space-lg);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      max-width: 380px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-md) var(--space-md);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      border: 1px solid var(--border-secondary);
      box-shadow: var(--shadow-lg);
      animation: toastSlideIn 300ms ease forwards;
      font-size: var(--font-sm);
    }

    .toast-success {
      border-color: rgba(34, 197, 94, 0.3);
      .toast-icon { color: var(--success); }
    }

    .toast-error {
      border-color: rgba(239, 68, 68, 0.3);
      .toast-icon { color: var(--error); }
    }

    .toast-warning {
      border-color: rgba(245, 158, 11, 0.3);
      .toast-icon { color: var(--warning); }
    }

    .toast-info {
      border-color: rgba(59, 130, 246, 0.3);
      .toast-icon { color: var(--info); }
    }

    .toast-icon {
      flex-shrink: 0;
      display: flex;
    }

    .toast-message {
      flex: 1;
      color: var(--text-primary);
    }

    .toast-dismiss {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: var(--radius-sm);
      color: var(--text-tertiary);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--bg-surface-hover);
        color: var(--text-secondary);
      }
    }

    @media (max-width: 768px) {
      .toast-container {
        top: var(--space-md);
        right: var(--space-md);
        left: var(--space-md);
        max-width: none;
      }
    }
  `],
})
export class ToastComponent {
  toastService = inject(ToastService);
}
