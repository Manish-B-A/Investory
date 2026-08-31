import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  getCurrentMonth,
  getMonthsAgo,
  getStartOfYear,
  getEndOfYear,
  formatMonth,
} from '../../../core/utilities/helpers';

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

@Component({
  selector: 'app-date-range-selector',
  standalone: true,
  template: `
    <div class="date-range-selector">
      <div class="quick-filters">
        @for (filter of quickFilters; track filter.label) {
          <button
            class="filter-chip"
            [class.active]="activeFilter === filter.label"
            (click)="selectFilter(filter)"
          >
            {{ filter.label }}
          </button>
        }
      </div>

      <div class="custom-range" [class.show]="activeFilter === 'Custom'">
        <div class="input-group">
          <label>From</label>
          <input type="month" [value]="customFrom" (change)="onCustomFromChange($event)">
        </div>
        <span class="separator">to</span>
        <div class="input-group">
          <label>To</label>
          <input type="month" [value]="customTo" (change)="onCustomToChange($event)">
        </div>
        <button class="btn-apply" (click)="applyCustomRange()">Apply</button>
      </div>
    </div>
  `,
  styles: [`
    .date-range-selector {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .quick-filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
    }

    .filter-chip {
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-full);
      background: var(--bg-surface);
      border: 1px solid var(--border-primary);
      color: var(--text-secondary);
      font-size: var(--font-sm);
      font-weight: var(--weight-medium);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--bg-surface-hover);
        color: var(--text-primary);
      }

      &.active {
        background: var(--accent);
        border-color: var(--accent);
        color: white;
      }
    }

    .custom-range {
      display: none;
      align-items: flex-end;
      gap: var(--space-md);
      padding: var(--space-md);
      background: var(--bg-surface);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      animation: fadeIn 200ms ease;

      &.show {
        display: flex;
      }

      @media (max-width: 600px) {
        flex-direction: column;
        align-items: stretch;
        
        .separator {
          display: none;
        }
      }
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
      flex: 1;

      label {
        font-size: var(--font-xs);
        color: var(--text-tertiary);
        font-weight: var(--weight-medium);
      }
    }

    .separator {
      color: var(--text-tertiary);
      padding-bottom: var(--space-sm);
    }

    .btn-apply {
      padding: var(--space-sm) var(--space-lg);
      background: var(--accent-subtle);
      color: var(--accent-text);
      border-radius: var(--radius-md);
      font-weight: var(--weight-medium);
      font-size: var(--font-sm);
      height: 38px;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--accent);
        color: white;
      }
    }
  `],
})
export class DateRangeSelectorComponent {
  @Input() earliestMonth = '2026-01'; // Default, should be provided by parent
  @Output() rangeChange = new EventEmitter<DateRange>();

  currentMonth = getCurrentMonth();
  
  quickFilters: DateRange[] = [
    { label: 'This Month', from: this.currentMonth, to: this.currentMonth },
    { label: 'Last 3 Months', from: getMonthsAgo(2), to: this.currentMonth },
    { label: 'Last 6 Months', from: getMonthsAgo(5), to: this.currentMonth },
    { label: 'Last 12 Months', from: getMonthsAgo(11), to: this.currentMonth },
    { label: 'This Year', from: getStartOfYear(), to: this.currentMonth },
    { label: 'Previous Year', from: getStartOfYear(new Date().getFullYear() - 1), to: getEndOfYear(new Date().getFullYear() - 1) },
    { label: 'All Time', from: this.earliestMonth, to: this.currentMonth },
    { label: 'Custom', from: '', to: '' },
  ];

  activeFilter = 'Last 6 Months';
  customFrom = getMonthsAgo(5);
  customTo = this.currentMonth;

  ngOnInit() {
    // Update All Time dynamically if earliestMonth is provided later
    this.quickFilters.find(f => f.label === 'All Time')!.from = this.earliestMonth;
  }

  selectFilter(filter: DateRange): void {
    this.activeFilter = filter.label;
    if (filter.label !== 'Custom') {
      this.rangeChange.emit(filter);
    }
  }

  onCustomFromChange(event: any): void {
    this.customFrom = event.target.value;
  }

  onCustomToChange(event: any): void {
    this.customTo = event.target.value;
  }

  applyCustomRange(): void {
    if (this.customFrom && this.customTo && this.customFrom <= this.customTo) {
      this.rangeChange.emit({
        from: this.customFrom,
        to: this.customTo,
        label: 'Custom'
      });
    }
  }
}
