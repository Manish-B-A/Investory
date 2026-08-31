import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          @if (icon === 'chart') {
            <rect x="6" y="6" width="36" height="36" rx="8" stroke="currentColor" stroke-width="1.5"/>
            <path d="M14 34L20 24L26 28L34 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          } @else if (icon === 'calendar') {
            <rect x="6" y="10" width="36" height="30" rx="4" stroke="currentColor" stroke-width="1.5"/>
            <line x1="6" y1="18" x2="42" y2="18" stroke="currentColor" stroke-width="1.5"/>
            <line x1="16" y1="10" x2="16" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="32" y1="10" x2="32" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          } @else {
            <rect x="6" y="6" width="36" height="36" rx="8" stroke="currentColor" stroke-width="1.5"/>
            <path d="M18 24H30M24 18V30" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          }
        </svg>
      </div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-message">{{ message }}</p>
      @if (actionLabel) {
        <button class="empty-action" (click)="onAction()">{{ actionLabel }}</button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: var(--space-3xl) var(--space-xl);
      animation: fadeIn 400ms ease;
    }

    .empty-icon {
      color: var(--text-tertiary);
      margin-bottom: var(--space-lg);
      opacity: 0.5;
    }

    .empty-title {
      font-size: var(--font-lg);
      font-weight: var(--weight-semibold);
      color: var(--text-secondary);
      margin-bottom: var(--space-sm);
    }

    .empty-message {
      font-size: var(--font-base);
      color: var(--text-tertiary);
      max-width: 320px;
      line-height: 1.6;
    }

    .empty-action {
      margin-top: var(--space-lg);
      padding: var(--space-sm) var(--space-xl);
      background: var(--accent);
      color: white;
      border-radius: var(--radius-md);
      font-weight: var(--weight-medium);
      font-size: var(--font-sm);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--accent-hover);
        transform: translateY(-1px);
      }
    }
  `],
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() message = '';
  @Input() actionLabel = '';
  @Input() icon: 'add' | 'chart' | 'calendar' = 'add';

  onAction(): void {
    // Parent handles via (click) on the action button — use event binding externally
  }
}
