import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  formatMonth,
  getNextMonth,
  getPreviousMonth,
} from '../../../core/utilities/helpers';

@Component({
  selector: 'app-month-selector',
  standalone: true,
  template: `
    <div class="month-selector">
      <button class="month-nav-btn" (click)="onPrevious()" aria-label="Previous month">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 4L6 9L11 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <button class="month-display" (click)="togglePicker()" [attr.aria-expanded]="showPicker" aria-label="Select month and year">
        <span class="month-text">{{ formattedMonth }}</span>
        <svg class="chevron" [class.open]="showPicker" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M4 5.5L7 8.5L10 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <button class="month-nav-btn" (click)="onNext()" aria-label="Next month">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M7 4L12 9L7 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      @if (showPicker) {
        <div class="month-picker-dropdown" role="dialog" aria-label="Month picker">
          <div class="picker-year-row">
            <button class="picker-nav" (click)="pickerYear = pickerYear - 1" aria-label="Previous year">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 3L4 7L9 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <span class="picker-year">{{ pickerYear }}</span>
            <button class="picker-nav" (click)="pickerYear = pickerYear + 1" aria-label="Next year">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3L10 7L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="picker-months">
            @for (m of monthNames; track m.value; let i = $index) {
              <button
                class="picker-month"
                [class.active]="isCurrentSelection(i)"
                (click)="selectMonth(i)"
              >
                {{ m.short }}
              </button>
            }
          </div>
        </div>
      }
    </div>

    @if (showPicker) {
      <div class="picker-backdrop" (click)="showPicker = false"></div>
    }
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
    }

    .month-selector {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      position: relative;
    }

    .month-nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      background: var(--bg-surface);
      border: 1px solid var(--border-primary);
      transition: all var(--transition-fast);

      &:hover {
        color: var(--text-primary);
        border-color: var(--border-secondary);
        background: var(--bg-surface-hover);
      }
    }

    .month-display {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border: 1px solid var(--border-primary);
      transition: all var(--transition-fast);
      min-width: 180px;
      justify-content: center;

      &:hover {
        border-color: var(--border-secondary);
        background: var(--bg-surface-hover);
      }
    }

    .month-text {
      font-weight: var(--weight-semibold);
      font-size: var(--font-md);
      color: var(--text-primary);
    }

    .chevron {
      color: var(--text-tertiary);
      transition: transform var(--transition-fast);

      &.open {
        transform: rotate(180deg);
      }
    }

    .month-picker-dropdown {
      position: absolute;
      top: calc(100% + var(--space-sm));
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-elevated);
      border: 1px solid var(--border-secondary);
      border-radius: var(--radius-lg);
      padding: var(--space-md);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      animation: scaleIn 200ms ease;
      min-width: 260px;
    }

    .picker-year-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-md);
    }

    .picker-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--bg-surface-hover);
        color: var(--text-primary);
      }
    }

    .picker-year {
      font-weight: var(--weight-semibold);
      font-size: var(--font-md);
      color: var(--text-primary);
    }

    .picker-months {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-xs);
    }

    .picker-month {
      padding: var(--space-sm);
      border-radius: var(--radius-sm);
      font-size: var(--font-sm);
      color: var(--text-secondary);
      font-weight: var(--weight-medium);
      transition: all var(--transition-fast);
      text-align: center;

      &:hover {
        background: var(--bg-surface-hover);
        color: var(--text-primary);
      }

      &.active {
        background: var(--accent);
        color: white;
      }
    }

    .picker-backdrop {
      position: fixed;
      inset: 0;
      z-index: 999;
    }
  `],
})
export class MonthSelectorComponent {
  @Input() month = '';
  @Output() monthChange = new EventEmitter<string>();

  showPicker = false;
  pickerYear = new Date().getFullYear();

  monthNames = [
    { short: 'Jan', value: '01' },
    { short: 'Feb', value: '02' },
    { short: 'Mar', value: '03' },
    { short: 'Apr', value: '04' },
    { short: 'May', value: '05' },
    { short: 'Jun', value: '06' },
    { short: 'Jul', value: '07' },
    { short: 'Aug', value: '08' },
    { short: 'Sep', value: '09' },
    { short: 'Oct', value: '10' },
    { short: 'Nov', value: '11' },
    { short: 'Dec', value: '12' },
  ];

  get formattedMonth(): string {
    return formatMonth(this.month);
  }

  togglePicker(): void {
    this.showPicker = !this.showPicker;
    if (this.showPicker) {
      const [year] = this.month.split('-').map(Number);
      this.pickerYear = year;
    }
  }

  isCurrentSelection(monthIndex: number): boolean {
    const [year, m] = this.month.split('-').map(Number);
    return year === this.pickerYear && m === monthIndex + 1;
  }

  selectMonth(monthIndex: number): void {
    const m = (monthIndex + 1).toString().padStart(2, '0');
    this.monthChange.emit(`${this.pickerYear}-${m}`);
    this.showPicker = false;
  }

  onPrevious(): void {
    this.monthChange.emit(getPreviousMonth(this.month));
  }

  onNext(): void {
    this.monthChange.emit(getNextMonth(this.month));
  }
}
