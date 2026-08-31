import { Component, Input } from '@angular/core';
import { InrCurrencyPipe } from '../../pipes/inr-currency.pipe';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [InrCurrencyPipe],
  template: `
    <div class="summary-card" [class.accent]="accent">
      <div class="card-header">
        <span class="card-label">{{ label }}</span>
        @if (badge) {
          <span class="card-badge">{{ badge }}</span>
        }
      </div>
      <div class="card-value" [class.currency]="isCurrency">
        @if (isCurrency) {
          {{ numericValue | inr }}
        } @else {
          {{ value }}
        }
      </div>
      @if (subtitle) {
        <div class="card-subtitle">{{ subtitle }}</div>
      }
    </div>
  `,
  styles: [`
    .summary-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      transition: all var(--transition-base);
      animation: fadeInUp 400ms ease both;

      &:hover {
        border-color: var(--border-secondary);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      &.accent {
        border-color: rgba(108, 99, 255, 0.2);
        background: linear-gradient(135deg, var(--bg-surface), rgba(108, 99, 255, 0.05));
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-sm);
    }

    .card-label {
      font-size: var(--font-sm);
      color: var(--text-secondary);
      font-weight: var(--weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .card-badge {
      font-size: var(--font-xs);
      color: var(--accent-text);
      background: var(--accent-subtle);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-weight: var(--weight-medium);
    }

    .card-value {
      font-size: var(--font-2xl);
      font-weight: var(--weight-bold);
      color: var(--text-primary);
      letter-spacing: -0.02em;
      line-height: 1.2;

      &.currency {
        font-variant-numeric: tabular-nums;
      }
    }

    .card-subtitle {
      font-size: var(--font-xs);
      color: var(--text-tertiary);
      margin-top: var(--space-xs);
    }
  `],
})
export class SummaryCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() subtitle = '';
  @Input() badge = '';
  @Input() isCurrency = false;
  @Input() accent = false;

  get numericValue(): number {
    return typeof this.value === 'number' ? this.value : parseFloat(this.value) || 0;
  }
}
