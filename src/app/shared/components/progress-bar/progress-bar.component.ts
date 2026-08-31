import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  template: `
    <div class="progress-wrapper">
      @if (showLabel) {
        <div class="progress-header">
          <span class="progress-label">{{ label }}</span>
          <span class="progress-percent">{{ clampedPercentage }}%</span>
        </div>
      }
      <div class="progress-track" [attr.aria-valuenow]="clampedPercentage" aria-valuemin="0" aria-valuemax="100" role="progressbar" [attr.aria-label]="label">
        <div
          class="progress-fill"
          [style.width.%]="clampedPercentage"
          [class.complete]="clampedPercentage >= 100"
          [class.low]="clampedPercentage < 50"
          [class.mid]="clampedPercentage >= 50 && clampedPercentage < 100"
        ></div>
      </div>
    </div>
  `,
  styles: [`
    .progress-wrapper {
      width: 100%;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-sm);
    }

    .progress-label {
      font-size: var(--font-sm);
      color: var(--text-secondary);
      font-weight: var(--weight-medium);
    }

    .progress-percent {
      font-size: var(--font-sm);
      color: var(--text-primary);
      font-weight: var(--weight-semibold);
      font-variant-numeric: tabular-nums;
    }

    .progress-track {
      width: 100%;
      height: 8px;
      background: var(--bg-elevated);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: var(--radius-full);
      background: var(--accent);
      transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1);
      animation: progressFill 800ms ease;

      &.complete {
        background: var(--success);
      }

      &.low {
        background: var(--warning);
      }

      &.mid {
        background: var(--accent);
      }
    }
  `],
})
export class ProgressBarComponent {
  @Input() percentage = 0;
  @Input() label = '';
  @Input() showLabel = true;

  get clampedPercentage(): number {
    return Math.max(0, Math.min(100, Math.round(this.percentage * 10) / 10));
  }
}
