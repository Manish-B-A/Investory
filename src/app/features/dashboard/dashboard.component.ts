import { Component, inject, OnInit, Signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalculationService } from '../../core/services/calculation.service';
import { InvestmentService } from '../../core/services/investment.service';
import { MonthlyService } from '../../core/services/monthly.service';
import {
  getGreeting,
  getCurrentMonth,
  formatMonth,
  getMonthsAgo
} from '../../core/utilities/helpers';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card.component';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SummaryCardComponent, ProgressBarComponent, InrCurrencyPipe],
  template: `
    <div class="dashboard-container fade-in">
      <header class="dashboard-header">
        <div>
          <h1 class="greeting">{{ greeting }} <span class="wave">👋</span></h1>
          <p class="subtitle">Your investment overview</p>
        </div>
        <div class="current-month-badge">{{ formattedCurrentMonth }}</div>
      </header>

      <!-- Summary Metrics Grid -->
      <section class="metrics-grid">
        <app-summary-card
          label="This Month"
          [value]="currentMonthStats().actual"
          [isCurrency]="true"
          [accent]="true"
        />
        <app-summary-card
          label="Total Invested"
          [value]="totalInvested()"
          [isCurrency]="true"
        />
        <app-summary-card
          label="Monthly Avg"
          [value]="monthlyAverage()"
          [isCurrency]="true"
        />
        <app-summary-card
          label="Active Investments"
          [value]="activeInvestmentCount()"
        />
      </section>

      <!-- Current Month Progress -->
      <section class="card progress-section">
        <div class="card-header">
          <h2 class="card-title">Current Month Progress</h2>
          <span class="progress-ratio">{{ currentMonthStats().actual | inr }} / {{ currentMonthStats().planned | inr }}</span>
        </div>
        <app-progress-bar
          [percentage]="currentMonthStats().percentage"
          [showLabel]="false"
        />
      </section>

      <div class="dashboard-grid">
        <!-- Breakdown Chart -->
        <section class="card breakdown-section">
          <h2 class="card-title">Investment Breakdown</h2>
          
          @if (breakdown().length === 0) {
            <div class="empty-chart">
              <span class="empty-text">No data for this month yet.</span>
            </div>
          } @else {
            <div class="breakdown-list">
              @for (item of breakdown(); track item.name; let i = $index) {
                <div class="breakdown-item" [style.animation-delay]="i * 100 + 'ms'">
                  <div class="breakdown-header">
                    <span class="breakdown-name">{{ item.name }}</span>
                    <span class="breakdown-amount">{{ item.amount | inr }}</span>
                  </div>
                  <div class="breakdown-bar-bg">
                    <div 
                      class="breakdown-bar-fill"
                      [style.width.%]="item.percentage"
                    ></div>
                  </div>
                  <span class="breakdown-percent">{{ item.percentage }}%</span>
                </div>
              }
            </div>
          }
        </section>

        <!-- Recent Months List -->
        <section class="card recent-section">
          <h2 class="card-title">Recent Months</h2>
          
          @if (recentMonths().length === 0) {
            <div class="empty-chart">
              <span class="empty-text">Start recording to see history.</span>
            </div>
          } @else {
            <div class="recent-list">
              @for (month of recentMonths(); track month.month) {
                <div class="recent-item">
                  <span class="recent-month">{{ formatDisplayMonth(month.month) }}</span>
                  <span class="recent-amount">{{ month.actual | inr }}</span>
                </div>
              }
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-xl);
    }

    .fade-in {
      animation: fadeIn 400ms ease;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .greeting {
      font-size: var(--font-2xl);
      font-weight: var(--weight-bold);
      color: var(--text-primary);
      margin-bottom: var(--space-xs);
      letter-spacing: -0.02em;
    }

    .wave {
      display: inline-block;
      animation: wave 2.5s infinite;
      transform-origin: 70% 70%;
    }

    @keyframes wave {
      0% { transform: rotate(0deg); }
      10% { transform: rotate(14deg); }
      20% { transform: rotate(-8deg); }
      30% { transform: rotate(14deg); }
      40% { transform: rotate(-4deg); }
      50% { transform: rotate(10deg); }
      60% { transform: rotate(0deg); }
      100% { transform: rotate(0deg); }
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: var(--font-base);
    }

    .current-month-badge {
      background: var(--bg-elevated);
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-full);
      font-size: var(--font-sm);
      color: var(--text-secondary);
      font-weight: var(--weight-medium);
      border: 1px solid var(--border-primary);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--space-lg);
    }

    .card {
      background: var(--bg-surface);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-md);
    }

    .card-title {
      font-size: var(--font-md);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
    }

    .progress-section {
      padding: var(--space-xl);
    }

    .progress-ratio {
      font-family: monospace;
      color: var(--text-secondary);
      font-size: var(--font-sm);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--space-lg);
    }

    /* Breakdown Styles */
    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      margin-top: var(--space-lg);
    }

    .breakdown-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
      animation: slideInRight 400ms ease both;
    }

    .breakdown-header {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-sm);
    }

    .breakdown-name {
      color: var(--text-secondary);
      font-weight: var(--weight-medium);
    }

    .breakdown-amount {
      color: var(--text-primary);
      font-weight: var(--weight-semibold);
    }

    .breakdown-bar-bg {
      height: 8px;
      background: var(--bg-elevated);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-bottom: 2px;
    }

    .breakdown-bar-fill {
      height: 100%;
      background: var(--accent);
      border-radius: var(--radius-full);
      transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
      width: 0;
      animation: progressFill 1s ease forwards;
    }

    .breakdown-percent {
      font-size: 10px;
      color: var(--text-tertiary);
      align-self: flex-end;
    }

    /* Recent Months Styles */
    .recent-list {
      display: flex;
      flex-direction: column;
      margin-top: var(--space-md);
    }

    .recent-item {
      display: flex;
      justify-content: space-between;
      padding: var(--space-md) 0;
      border-bottom: 1px solid var(--border-primary);

      &:last-child {
        border-bottom: none;
      }
    }

    .recent-month {
      color: var(--text-secondary);
      font-size: var(--font-sm);
    }

    .recent-amount {
      color: var(--text-primary);
      font-weight: var(--weight-semibold);
      font-size: var(--font-sm);
    }

    .empty-chart {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 150px;
      background: var(--bg-elevated);
      border-radius: var(--radius-md);
      margin-top: var(--space-md);
      border: 1px dashed var(--border-secondary);
    }

    .empty-text {
      color: var(--text-tertiary);
      font-size: var(--font-sm);
    }

    @media (max-width: 1024px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-md);
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private calcService = inject(CalculationService);
  private invService = inject(InvestmentService);
  private monthlyService = inject(MonthlyService);

  greeting = getGreeting();
  currentMonthStr = getCurrentMonth();
  formattedCurrentMonth = formatMonth(this.currentMonthStr);

  // Computed Signals
  totalInvested = computed(() => this.calcService.getTotalInvested());
  monthlyAverage = computed(() => this.calcService.getMonthlyAverage());
  activeInvestmentCount = this.invService.activeCount;

  currentMonthStats = computed(() => {
    // Need to touch records to trigger update if they change
    this.monthlyService.records(); 
    return this.calcService.getCurrentMonthProgress(this.currentMonthStr);
  });

  breakdown = computed(() => {
    this.monthlyService.records();
    return this.calcService.getInvestmentPercentages(this.currentMonthStr)
      .sort((a, b) => b.amount - a.amount);
  });

  recentMonths = computed(() => {
    this.monthlyService.records();
    const sixMonthsAgo = getMonthsAgo(5);
    const report = this.calcService.getReportData(sixMonthsAgo, this.currentMonthStr);
    return report.monthlyTrend.reverse();
  });

  ngOnInit() {
    // Ensure current month exists so we can track it
    this.monthlyService.getOrCreateMonth(this.currentMonthStr);
  }

  formatDisplayMonth(m: string): string {
    return formatMonth(m);
  }
}
