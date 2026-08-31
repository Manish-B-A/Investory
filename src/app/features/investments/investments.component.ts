import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvestmentService } from '../../core/services/investment.service';
import { MonthlyService } from '../../core/services/monthly.service';
import { ToastService } from '../../core/services/toast.service';
import { InvestmentComponent } from '../../core/models/investment.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, InrCurrencyPipe],
  template: `
    <div class="investments-container fade-in">
      <header class="page-header">
        <div>
          <h1 class="page-title">Investment Components</h1>
          <p class="subtitle">Manage your global investment categories and default amounts</p>
        </div>
        <button class="btn btn-primary" (click)="showAddForm = true" *ngIf="!showAddForm">
          + Add Investment
        </button>
      </header>

      @if (showAddForm) {
        <div class="card add-form-card">
          <div class="card-header">
            <h2 class="card-title">New Investment</h2>
            <button class="icon-btn" (click)="cancelAdd()">✕</button>
          </div>
          <form class="add-form" (ngSubmit)="onAddSubmit()">
            <div class="form-group">
              <label>Name</label>
              <input type="text" [(ngModel)]="newInv.name" name="name" placeholder="e.g. Stocks" required>
            </div>
            <div class="form-group">
              <label>Type (Optional)</label>
              <input type="text" [(ngModel)]="newInv.type" name="type" placeholder="e.g. Equity">
            </div>
            <div class="form-group">
              <label>Default Monthly Amount</label>
              <div class="input-with-prefix">
                <span class="prefix">₹</span>
                <input type="number" [(ngModel)]="newInv.amount" name="amount" min="0" required>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="cancelAdd()">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Investment</button>
            </div>
          </form>
        </div>
      }

      <div class="investment-grid">
        @for (inv of investments(); track inv.id) {
          <div class="card inv-card" [class.inactive]="!inv.active">
            
            @if (editingId() === inv.id) {
              <!-- Edit Mode -->
              <div class="inv-edit-form">
                <div class="form-group">
                  <label>Name</label>
                  <input type="text" [(ngModel)]="editData.name">
                </div>
                <div class="form-group">
                  <label>Default Amount</label>
                  <div class="input-with-prefix">
                    <span class="prefix">₹</span>
                    <input type="number" [(ngModel)]="editData.amount" min="0">
                  </div>
                </div>
                <div class="edit-actions">
                  <button class="btn btn-secondary btn-sm" (click)="cancelEdit()">Cancel</button>
                  <button class="btn btn-primary btn-sm" (click)="saveEdit(inv.id)">Save</button>
                </div>
              </div>
            } @else {
              <!-- View Mode -->
              <div class="inv-card-header">
                <div class="inv-title-group">
                  <h3 class="inv-name">{{ inv.name }}</h3>
                  @if (inv.type) {
                    <span class="inv-type">{{ inv.type }}</span>
                  }
                </div>
                <div class="badge-group">
                  @if (inv.active) {
                    <span class="badge badge-active">Active</span>
                  } @else {
                    <span class="badge badge-inactive">Inactive</span>
                  }
                </div>
              </div>
              
              <div class="inv-card-body">
                <div class="inv-amount-group">
                  <span class="inv-label">Default Monthly</span>
                  <span class="inv-amount">{{ inv.defaultMonthlyAmount | inr }}</span>
                </div>
              </div>
              
              <div class="inv-card-footer">
                <div class="inv-actions">
                  <button class="action-btn" (click)="startEdit(inv)">Edit</button>
                  <button class="action-btn" (click)="toggleActive(inv)">
                    {{ inv.active ? 'Deactivate' : 'Activate' }}
                  </button>
                </div>
                <button class="action-btn danger" (click)="confirmDelete(inv)">Delete</button>
              </div>
            }
          </div>
        }
      </div>

      @if (investments().length === 0 && !showAddForm) {
        <div class="empty-state">
          <p class="empty-message">No investments configured yet.</p>
          <button class="btn btn-primary" (click)="showAddForm = true">Create First Investment</button>
        </div>
      }

      <app-confirm-dialog
        [open]="deleteDialog.show"
        title="Delete Investment"
        [message]="deleteDialog.message"
        confirmText="Yes, delete it"
        [danger]="true"
        (confirmed)="onDeleteConfirm()"
        (cancelled)="deleteDialog.show = false"
      />
    </div>
  `,
  styles: [`
    .investments-container {
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

    /* Buttons */
    .btn {
      padding: var(--space-sm) var(--space-lg);
      border-radius: var(--radius-md);
      font-size: var(--font-sm);
      font-weight: var(--weight-medium);
      transition: all var(--transition-fast);
      cursor: pointer;

      &.btn-primary {
        background: var(--accent);
        color: white;
        &:hover { background: var(--accent-hover); }
      }

      &.btn-secondary {
        background: var(--bg-surface-hover);
        color: var(--text-primary);
        border: 1px solid var(--border-primary);
        &:hover { border-color: var(--border-secondary); }
      }

      &.btn-sm {
        padding: var(--space-xs) var(--space-md);
      }
    }
    
    .icon-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      transition: all var(--transition-fast);
      
      &:hover {
        background: var(--bg-surface-hover);
        color: var(--text-primary);
      }
    }

    .action-btn {
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: var(--font-xs);
      font-weight: var(--weight-medium);
      color: var(--text-secondary);
      background: var(--bg-elevated);
      border: 1px solid var(--border-secondary);
      transition: all var(--transition-fast);

      &:hover {
        color: var(--text-primary);
        border-color: var(--text-tertiary);
        background: var(--bg-surface-hover);
      }

      &.danger {
        color: var(--error);
        border-color: rgba(239, 68, 68, 0.3);
        
        &:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--error);
        }
      }
    }

    /* Add Form */
    .add-form-card {
      background: var(--bg-surface);
      border: 1px solid var(--accent);
      border-radius: var(--radius-lg);
      padding: var(--space-xl);
      animation: slideInRight 300ms ease;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-lg);
    }
    
    .card-title {
      font-size: var(--font-lg);
      font-weight: var(--weight-semibold);
    }

    .add-form {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: var(--space-lg);
      align-items: flex-end;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);

      label {
        font-size: var(--font-xs);
        color: var(--text-tertiary);
        font-weight: var(--weight-medium);
      }

      input {
        width: 100%;
      }
    }
    
    .input-with-prefix {
      position: relative;
      display: flex;
      align-items: center;
      
      .prefix {
        position: absolute;
        left: var(--space-md);
        color: var(--text-tertiary);
        pointer-events: none;
      }
      
      input {
        padding-left: calc(var(--space-md) + 20px);
      }
    }

    .form-actions {
      display: flex;
      gap: var(--space-sm);
      justify-content: flex-end;
      grid-column: 1 / -1;
      margin-top: var(--space-sm);
    }

    /* Grid & Cards */
    .investment-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-lg);
    }

    .inv-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      transition: all var(--transition-base);

      &:hover {
        border-color: var(--border-secondary);
        box-shadow: var(--shadow-md);
      }

      &.inactive {
        opacity: 0.7;
        background: var(--bg-elevated);
      }
    }

    .inv-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-md);
    }

    .inv-title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .inv-name {
      font-size: var(--font-lg);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
    }

    .inv-type {
      font-size: var(--font-xs);
      color: var(--text-tertiary);
    }

    .badge {
      font-size: 10px;
      padding: 4px 8px;
      border-radius: var(--radius-full);
      font-weight: var(--weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.05em;

      &.badge-active {
        background: var(--success-subtle);
        color: var(--success);
      }

      &.badge-inactive {
        background: var(--border-primary);
        color: var(--text-secondary);
      }
    }

    .inv-card-body {
      flex: 1;
      margin-bottom: var(--space-xl);
    }

    .inv-amount-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .inv-label {
      font-size: var(--font-xs);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .inv-amount {
      font-size: var(--font-2xl);
      font-weight: var(--weight-bold);
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .inv-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: var(--space-md);
      border-top: 1px dashed var(--border-primary);
    }

    .inv-actions {
      display: flex;
      gap: var(--space-sm);
    }

    /* Edit Form within Card */
    .inv-edit-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      
      .edit-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-sm);
        margin-top: var(--space-xs);
      }
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--space-3xl);
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      border: 1px dashed var(--border-secondary);
      
      .empty-message {
        color: var(--text-secondary);
        margin-bottom: var(--space-lg);
      }
    }
  `],
})
export class InvestmentsComponent {
  private invService = inject(InvestmentService);
  private monthlyService = inject(MonthlyService);
  private toast = inject(ToastService);

  investments = this.invService.components;
  
  showAddForm = false;
  newInv = { name: '', type: '', amount: 0 };
  
  editingId = signal<string | null>(null);
  editData = { name: '', amount: 0 };

  deleteDialog = {
    show: false,
    invId: '',
    message: ''
  };

  onAddSubmit() {
    if (!this.newInv.name || this.newInv.amount <= 0) {
      this.toast.error('Please provide a valid name and amount greater than 0');
      return;
    }

    try {
      this.invService.add(this.newInv.name, this.newInv.amount, this.newInv.type);
      this.toast.success('Investment added successfully');
      this.cancelAdd();
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  cancelAdd() {
    this.showAddForm = false;
    this.newInv = { name: '', type: '', amount: 0 };
  }

  startEdit(inv: InvestmentComponent) {
    this.editingId.set(inv.id);
    this.editData = { name: inv.name, amount: inv.defaultMonthlyAmount };
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  saveEdit(id: string) {
    if (!this.editData.name || this.editData.amount < 0) {
      this.toast.error('Invalid data');
      return;
    }

    try {
      this.invService.update(id, {
        name: this.editData.name,
        defaultMonthlyAmount: this.editData.amount
      });
      this.toast.success('Investment updated');
      this.editingId.set(null);
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  toggleActive(inv: InvestmentComponent) {
    this.invService.toggleActive(inv.id);
    this.toast.info(`${inv.name} is now ${!inv.active ? 'active' : 'inactive'}`);
  }

  confirmDelete(inv: InvestmentComponent) {
    const hasRecords = this.monthlyService.hasAnyRecordsForInvestment(inv.id);
    
    this.deleteDialog.invId = inv.id;
    
    if (hasRecords) {
      this.deleteDialog.message = `"${inv.name}" has historical records. Deleting it completely will remove these records from all past months and reports. We recommend deactivating it instead.\n\nAre you sure you want to permanently delete it?`;
    } else {
      this.deleteDialog.message = `Are you sure you want to delete "${inv.name}"? This action cannot be undone.`;
    }
    
    this.deleteDialog.show = true;
  }

  onDeleteConfirm() {
    try {
      this.invService.delete(this.deleteDialog.invId);
      this.toast.success('Investment deleted');
    } catch (e: any) {
      this.toast.error(e.message);
    } finally {
      this.deleteDialog.show = false;
    }
  }
}
