import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonthlyService } from '../../core/services/monthly.service';
import { CalculationService } from '../../core/services/calculation.service';
import { ToastService } from '../../core/services/toast.service';
import { getCurrentMonth } from '../../core/utilities/helpers';
import { MonthSelectorComponent } from '../../shared/components/month-selector/month-selector.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-monthly-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, MonthSelectorComponent, EmptyStateComponent, InrCurrencyPipe],
  template: `
    <div class="monthly-container fade-in">
      <header class="page-header">
        <div>
          <h1 class="page-title">Monthly Tracker</h1>
          <p class="subtitle">Track and update your investments month by month</p>
        </div>
        <app-month-selector
          [month]="selectedMonth()"
          (monthChange)="onMonthChange($event)"
        />
      </header>

      @if (stats()) {
        <!-- Summary Cards -->
        <div class="summary-row">
          <div class="mini-stat">
            <span class="stat-label">Planned</span>
            <span class="stat-value">{{ stats()!.totalPlanned | inr }}</span>
          </div>
          <div class="mini-stat accent">
            <span class="stat-label">Actual</span>
            <span class="stat-value">{{ stats()!.totalActual | inr }}</span>
          </div>
          <div class="mini-stat" [class.positive]="stats()!.difference > 0" [class.negative]="stats()!.difference < 0">
            <span class="stat-label">Difference</span>
            <span class="stat-value">
              {{ stats()!.difference > 0 ? '+' : '' }}{{ stats()!.difference | inr }}
            </span>
          </div>
        </div>

        @if (stats()!.entries.length === 0) {
          <app-empty-state
            title="No investments found"
            message="There are no active investments configured for this month."
            icon="add"
          />
        } @else {
          <!-- Desktop Table View -->
          <div class="table-container desktop-only">
            <table class="investment-table">
              <thead>
                <tr>
                  <th>Investment</th>
                  <th class="text-right">Planned</th>
                  <th class="text-right">Actual</th>
                  <th class="text-right">Difference</th>
                  <th class="text-center">Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (entry of stats()!.entries; track entry.investmentId) {
                  <tr [class.inactive]="!entry.investmentActive">
                    <td>
                      <div class="inv-name-cell">
                        <span class="inv-name">{{ entry.investmentName }}</span>
                        @if (!entry.investmentActive) {
                          <span class="badge badge-inactive">Inactive</span>
                        }
                      </div>
                    </td>
                    <td class="text-right num-cell">{{ entry.plannedAmount | inr }}</td>
                    <td class="text-right">
                      @if (editingId() === entry.investmentId) {
                        <input
                          type="number"
                          class="inline-input"
                          [(ngModel)]="editValue"
                          (blur)="saveEdit(entry.investmentId, editValue.toString())"
                          (keyup.enter)="saveEdit(entry.investmentId, editValue.toString())"
                          (keyup.escape)="cancelEdit()"
                          min="0"
                          step="100"
                        >
                      } @else {
                        <span class="num-cell" [class.placeholder]="entry.actualAmount === null">
                          {{ (entry.actualAmount ?? entry.plannedAmount) | inr }}
                        </span>
                      }
                    </td>
                    <td class="text-right num-cell" [class.positive]="getDiff(entry) > 0" [class.negative]="getDiff(entry) < 0">
                      {{ getDiff(entry) > 0 ? '+' : '' }}{{ getDiff(entry) | inr }}
                    </td>
                    <td class="text-center">
                      <button 
                        class="status-toggle" 
                        [class.invested]="entry.invested"
                        (click)="toggleInvested(entry)"
                        [attr.aria-label]="entry.invested ? 'Mark as pending' : 'Mark as invested'"
                      >
                        @if (entry.invested) {
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="1" y="1" width="14" height="14" rx="4" fill="currentColor"/>
                            <path d="M4.5 8L7 10.5L11.5 5.5" stroke="var(--bg-surface)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        } @else {
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="1" y="1" width="14" height="14" rx="4" stroke="currentColor" stroke-width="2"/>
                          </svg>
                        }
                        <span class="status-text">{{ entry.invested ? 'Invested' : 'Pending' }}</span>
                      </button>
                    </td>
                    <td class="text-right">
                      @if (editingId() === entry.investmentId) {
                        <button class="action-btn save" (click)="saveEdit(entry.investmentId, editValue.toString())">Save</button>
                      } @else {
                        <button class="action-btn edit" (click)="startEdit(entry.investmentId, entry.actualAmount ?? entry.plannedAmount)">Edit</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total</strong></td>
                  <td class="text-right num-cell"><strong>{{ stats()!.totalPlanned | inr }}</strong></td>
                  <td class="text-right num-cell"><strong>{{ stats()!.totalActual | inr }}</strong></td>
                  <td class="text-right num-cell" [class.positive]="stats()!.difference > 0" [class.negative]="stats()!.difference < 0">
                    <strong>{{ stats()!.difference > 0 ? '+' : '' }}{{ stats()!.difference | inr }}</strong>
                  </td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Mobile Card View -->
          <div class="mobile-only cards-list">
            @for (entry of stats()!.entries; track entry.investmentId) {
              <div class="mobile-card" [class.inactive]="!entry.investmentActive">
                <div class="mc-header">
                  <div class="mc-title">
                    <span class="inv-name">{{ entry.investmentName }}</span>
                    @if (!entry.investmentActive) {
                      <span class="badge badge-inactive">Inactive</span>
                    }
                  </div>
                  <button 
                    class="status-toggle icon-only" 
                    [class.invested]="entry.invested"
                    (click)="toggleInvested(entry)"
                  >
                    @if (entry.invested) {
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="9" fill="currentColor"/>
                        <path d="M6 10L9 13L14 7" stroke="var(--bg-surface)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    } @else {
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    }
                  </button>
                </div>
                
                <div class="mc-body">
                  <div class="mc-row">
                    <span class="mc-label">Planned</span>
                    <span class="mc-value">{{ entry.plannedAmount | inr }}</span>
                  </div>
                  
                  <div class="mc-row">
                    <span class="mc-label">Actual</span>
                    @if (editingId() === entry.investmentId) {
                      <div class="mc-edit-group">
                        <input
                          #mobileActual
                          type="number"
                          class="inline-input mobile"
                          [value]="entry.actualAmount ?? entry.plannedAmount"
                          min="0"
                        >
                        <button class="action-btn save small" (click)="saveEdit(entry.investmentId, mobileActual.value)">✓</button>
                        <button class="action-btn cancel small" (click)="cancelEdit()">✕</button>
                      </div>
                    } @else {
                      <div class="mc-value-group">
                        <span class="mc-value highlight" [class.placeholder]="entry.actualAmount === null">
                          {{ (entry.actualAmount ?? entry.plannedAmount) | inr }}
                        </span>
                        <button class="action-btn edit text-only" (click)="startEdit(entry.investmentId, entry.actualAmount ?? entry.plannedAmount)">Edit</button>
                      </div>
                    }
                  </div>
                  
                  <div class="mc-row">
                    <span class="mc-label">Difference</span>
                    <span class="mc-value diff" [class.positive]="getDiff(entry) > 0" [class.negative]="getDiff(entry) < 0">
                      {{ getDiff(entry) > 0 ? '+' : '' }}{{ getDiff(entry) | inr }}
                    </span>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      } @else {
        <app-empty-state
          title="Month not found"
          message="Could not load data for the selected month."
          icon="calendar"
        />
      }
    </div>
  `,
  styles: [`
    .monthly-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-xl);
    }

    .fade-in {
      animation: fadeIn 400ms ease;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: var(--space-md);
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

    /* Summary Row */
    .summary-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-md);
    }

    .mini-stat {
      background: var(--bg-surface);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      padding: var(--space-md) var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);

      &.accent {
        border-color: rgba(108, 99, 255, 0.3);
        background: linear-gradient(135deg, var(--bg-surface), rgba(108, 99, 255, 0.05));
      }
    }

    .stat-label {
      font-size: var(--font-xs);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: var(--weight-medium);
    }

    .stat-value {
      font-size: var(--font-xl);
      color: var(--text-primary);
      font-weight: var(--weight-semibold);
      font-variant-numeric: tabular-nums;
    }

    /* Table Styles */
    .table-container {
      background: var(--bg-surface);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      overflow-x: auto;
    }

    .investment-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      th, td {
        padding: var(--space-md) var(--space-lg);
        border-bottom: 1px solid var(--border-primary);
      }

      th {
        font-size: var(--font-xs);
        color: var(--text-secondary);
        font-weight: var(--weight-medium);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: var(--bg-elevated);
      }

      tbody tr {
        transition: background var(--transition-fast);

        &:hover {
          background: var(--bg-surface-hover);
        }

        &.inactive {
          opacity: 0.6;
          
          &:hover {
            opacity: 0.8;
          }
        }
      }

      tfoot {
        background: var(--bg-elevated);
        td {
          border-bottom: none;
        }
      }
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }
    
    .num-cell {
      font-variant-numeric: tabular-nums;
    }

    .inv-name-cell {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .inv-name {
      font-weight: var(--weight-medium);
      color: var(--text-primary);
    }

    .badge-inactive {
      font-size: 10px;
      padding: 2px 6px;
      background: var(--border-primary);
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      text-transform: uppercase;
    }

    .placeholder {
      color: var(--text-tertiary);
      font-style: italic;
    }

    .positive { color: var(--success) !important; }
    .negative { color: var(--warning) !important; }

    /* Inputs & Buttons */
    .inline-input {
      width: 120px;
      padding: var(--space-xs) var(--space-sm);
      text-align: right;
      font-variant-numeric: tabular-nums;
      background: var(--bg-input);
      border: 1px solid var(--accent);
      color: var(--text-primary);
      border-radius: var(--radius-sm);

      &.mobile {
        width: 100px;
      }
    }

    .action-btn {
      padding: 4px 12px;
      border-radius: var(--radius-sm);
      font-size: var(--font-xs);
      font-weight: var(--weight-medium);
      transition: all var(--transition-fast);

      &.edit {
        background: var(--bg-elevated);
        border: 1px solid var(--border-secondary);
        color: var(--text-secondary);

        &:hover {
          background: var(--bg-surface-hover);
          color: var(--text-primary);
          border-color: var(--text-tertiary);
        }
      }

      &.save {
        background: var(--accent);
        color: white;

        &:hover {
          background: var(--accent-hover);
        }
      }
      
      &.cancel {
        background: var(--bg-elevated);
        color: var(--text-secondary);
      }
      
      &.small {
        padding: 4px 8px;
      }
      
      &.text-only {
        background: transparent;
        border: none;
        color: var(--accent-text);
        padding: 0;
        
        &:hover {
          color: var(--accent-hover);
          text-decoration: underline;
        }
      }
    }

    .status-toggle {
      display: inline-flex;
      align-items: center;
      gap: var(--space-xs);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      font-size: var(--font-xs);
      font-weight: var(--weight-medium);
      transition: all var(--transition-fast);
      border: 1px solid transparent;

      &:hover {
        background: var(--bg-surface-hover);
        color: var(--text-primary);
      }

      &.invested {
        color: var(--success);
        background: var(--success-subtle);
      }
      
      &.icon-only {
        padding: 4px;
        background: transparent;
        
        &:hover {
          background: var(--bg-surface-hover);
        }
      }
    }

    /* Mobile Views */
    .mobile-only { display: none; }
    .desktop-only { display: block; }

    @media (max-width: 768px) {
      .desktop-only { display: none; }
      .mobile-only { display: block; }

      .summary-row {
        grid-template-columns: 1fr;
      }

      .cards-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .mobile-card {
        background: var(--bg-surface);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        
        &.inactive {
          opacity: 0.7;
        }
      }

      .mc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-md);
        padding-bottom: var(--space-sm);
        border-bottom: 1px solid var(--border-primary);
      }
      
      .mc-title {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .mc-body {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
      }

      .mc-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .mc-label {
        font-size: var(--font-sm);
        color: var(--text-secondary);
      }

      .mc-value {
        font-size: var(--font-sm);
        color: var(--text-primary);
        font-weight: var(--weight-medium);
        font-variant-numeric: tabular-nums;
        
        &.highlight {
          font-weight: var(--weight-bold);
          font-size: var(--font-md);
        }
      }
      
      .mc-value-group {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }
      
      .mc-edit-group {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
      }
    }
  `],
})
export class MonthlyTrackerComponent implements OnInit {
  private calcService = inject(CalculationService);
  private monthlyService = inject(MonthlyService);
  private toast = inject(ToastService);

  selectedMonth = signal(getCurrentMonth());
  editingId = signal<string | null>(null);
  editValue: number = 0;

  stats = computed(() => {
    // Read monthly records to ensure reactivity
    this.monthlyService.records();
    return this.calcService.getMonthlyStats(this.selectedMonth());
  });

  ngOnInit() {
    this.ensureMonthExists(this.selectedMonth());
  }

  onMonthChange(newMonth: string) {
    this.selectedMonth.set(newMonth);
    this.ensureMonthExists(newMonth);
    this.editingId.set(null);
  }

  private ensureMonthExists(month: string) {
    this.monthlyService.getOrCreateMonth(month);
  }

  getDiff(entry: any): number {
    const actual = entry.actualAmount ?? entry.plannedAmount;
    return actual - entry.plannedAmount;
  }

  toggleInvested(entry: any) {
    try {
      this.monthlyService.updateEntry(
        this.selectedMonth(),
        entry.investmentId,
        { invested: !entry.invested }
      );
      if (!entry.invested) {
        this.toast.success(`Marked ${entry.investmentName} as invested`);
      }
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  startEdit(id: string, currentValue: number) {
    this.editingId.set(id);
    this.editValue = currentValue;
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  saveEdit(id: string, valueStr: string) {
    const val = parseFloat(valueStr);
    if (isNaN(val) || val < 0) {
      this.toast.error('Please enter a valid positive amount');
      return;
    }

    try {
      this.monthlyService.updateEntry(
        this.selectedMonth(),
        id,
        { actualAmount: val }
      );
      this.editingId.set(null);
      this.toast.success('Amount updated');
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }
}
