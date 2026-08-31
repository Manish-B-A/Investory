import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalculationService } from '../../core/services/calculation.service';
import { MonthlyService } from '../../core/services/monthly.service';
import { ToastService } from '../../core/services/toast.service';
import { 
  DateRangeSelectorComponent, 
  DateRange 
} from '../../shared/components/date-range-selector/date-range-selector.component';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { formatMonthShort, formatMonth } from '../../core/utilities/helpers';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, 
    DateRangeSelectorComponent, 
    SummaryCardComponent, 
    EmptyStateComponent, 
    InrCurrencyPipe
  ],
  template: `
    <div class="reports-container fade-in">
      <header class="page-header">
        <div>
          <h1 class="page-title">Reports & Trends</h1>
          <p class="subtitle">Analyze your investment history over time</p>
        </div>
        <button class="btn btn-secondary" (click)="downloadReport()" [disabled]="!reportData() || reportData()!.monthlyTrend.length === 0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 8px; vertical-align: text-bottom;">
            <path d="M14 11V14H2V11M8 2V11M8 11L4.5 7.5M8 11L11.5 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Export CSV
        </button>
      </header>

      <section class="filters-section card">
        <app-date-range-selector
          [earliestMonth]="earliestMonth()"
          (rangeChange)="onRangeChange($event)"
        />
      </section>

      @if (reportData() && reportData()!.monthlyTrend.length > 0) {
        
        <!-- Summary Stats -->
        <section class="metrics-grid">
          <app-summary-card
            label="Total Invested"
            [value]="reportData()!.totalActual"
            [isCurrency]="true"
            [accent]="true"
          />
          <app-summary-card
            label="Monthly Avg"
            [value]="reportData()!.averageMonthlyActual"
            [isCurrency]="true"
          />
          <app-summary-card
            label="Highest Month"
            [value]="reportData()!.highestMonth?.amount || 0"
            [subtitle]="formatDisplayMonth(reportData()!.highestMonth?.month)"
            [isCurrency]="true"
          />
          <app-summary-card
            label="Months Recorded"
            [value]="reportData()!.monthlyTrend.length"
          />
        </section>

        <!-- Trend Chart -->
        <section class="card chart-section">
          <h2 class="card-title">Investment Trend</h2>
          
          <div class="chart-container" #chartContainer>
            <svg class="trend-chart" [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" preserveAspectRatio="none">
              <!-- Grid lines -->
              @for (line of [0, 1, 2, 3, 4]; track line) {
                <line 
                  x1="0" 
                  [attr.y1]="chartHeight - (line * (chartHeight / 4))" 
                  [attr.x2]="chartWidth" 
                  [attr.y2]="chartHeight - (line * (chartHeight / 4))" 
                  stroke="var(--border-primary)" 
                  stroke-dasharray="4 4"
                />
              }
              
              <!-- Data line -->
              <path [attr.d]="trendPath()" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              
              <!-- Area under line -->
              <path [attr.d]="trendAreaPath()" fill="url(#areaGradient)" />
              
              <!-- Data points -->
              @for (point of chartPoints(); track point.x) {
                <circle [attr.cx]="point.x" [attr.cy]="point.y" r="4" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="2" class="data-point">
                  <title>{{ point.label }}: {{ point.value | inr }}</title>
                </circle>
              }
              
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
                </linearGradient>
              </defs>
            </svg>
            
            <div class="x-axis">
              @for (point of chartPoints(); track point.x; let i = $index) {
                <!-- Show max 6 labels to avoid crowding -->
                @if (chartPoints().length <= 6 || i % Math.ceil(chartPoints().length / 6) === 0 || i === chartPoints().length - 1) {
                  <span class="x-label" [style.left.%]="(point.x / chartWidth) * 100">{{ point.label }}</span>
                }
              }
            </div>
          </div>
        </section>

        <!-- Breakdown Table -->
        <section class="card breakdown-section">
          <h2 class="card-title">Investment Breakdown</h2>
          
          <div class="table-container">
            <table class="investment-table">
              <thead>
                <tr>
                  <th>Investment</th>
                  <th class="text-right">Total Planned</th>
                  <th class="text-right">Total Actual</th>
                  <th class="text-right">Monthly Avg</th>
                  <th class="text-right">Months Active</th>
                </tr>
              </thead>
              <tbody>
                @for (summary of reportData()!.investmentSummaries; track summary.investmentId) {
                  <tr>
                    <td class="font-medium">{{ summary.investmentName }}</td>
                    <td class="text-right num-cell">{{ summary.totalPlanned | inr }}</td>
                    <td class="text-right num-cell font-semibold text-primary">{{ summary.totalActual | inr }}</td>
                    <td class="text-right num-cell">{{ summary.averageMonthly | inr }}</td>
                    <td class="text-right num-cell">{{ summary.monthCount }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

      } @else {
        <app-empty-state
          title="Not enough data"
          message="There are no investment records for the selected time range. Try selecting a different range or start tracking your investments."
          icon="chart"
        />
      }
    </div>
  `,
  styles: [`
    .reports-container {
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

    .btn {
      padding: var(--space-sm) var(--space-lg);
      border-radius: var(--radius-md);
      font-size: var(--font-sm);
      font-weight: var(--weight-medium);
      transition: all var(--transition-fast);
      cursor: pointer;
      display: inline-flex;
      align-items: center;

      &.btn-secondary {
        background: var(--bg-surface);
        color: var(--text-primary);
        border: 1px solid var(--border-primary);
        
        &:hover:not(:disabled) { 
          background: var(--bg-surface-hover);
          border-color: var(--border-secondary); 
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .card {
      background: var(--bg-surface);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
    }

    .card-title {
      font-size: var(--font-md);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
      margin-bottom: var(--space-lg);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--space-lg);
    }

    /* Chart Styles */
    .chart-container {
      position: relative;
      width: 100%;
      height: 300px;
      margin-top: var(--space-md);
    }

    .trend-chart {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .data-point {
      transition: r 0.2s ease;
      cursor: pointer;
      
      &:hover {
        r: 6;
      }
    }

    .x-axis {
      position: absolute;
      bottom: -25px;
      left: 0;
      width: 100%;
      height: 20px;
    }

    .x-label {
      position: absolute;
      transform: translateX(-50%);
      font-size: 10px;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    /* Table Styles */
    .table-container {
      overflow-x: auto;
    }

    .investment-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      th, td {
        padding: var(--space-md);
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
      }
    }

    .text-right { text-align: right; }
    .num-cell { font-variant-numeric: tabular-nums; }
    .font-medium { font-weight: var(--weight-medium); }
    .font-semibold { font-weight: var(--weight-semibold); }
    .text-primary { color: var(--text-primary); }

  `],
})
export class ReportsComponent {
  private calcService = inject(CalculationService);
  private monthlyService = inject(MonthlyService);
  private toast = inject(ToastService);

  // Expose Math to template for chart logic
  Math = Math;

  currentRange = signal<DateRange | null>(null);

  earliestMonth = computed(() => {
    const records = this.monthlyService.records();
    if (records.length === 0) return formatMonthShort(new Date().toISOString());
    return records[0].month;
  });

  reportData = computed(() => {
    const range = this.currentRange();
    if (!range) return null;
    return this.calcService.getReportData(range.from, range.to);
  });

  // Chart configuration
  chartWidth = 800;
  chartHeight = 240;
  
  chartPoints = computed(() => {
    const data = this.reportData()?.monthlyTrend || [];
    if (data.length === 0) return [];
    
    // Find min and max for scaling
    const maxVal = Math.max(...data.map(d => d.actual), 100);
    // Add 10% padding to top
    const scaleMax = maxVal * 1.1; 
    
    // Calculate points
    const stepX = data.length > 1 ? this.chartWidth / (data.length - 1) : this.chartWidth / 2;
    
    return data.map((point, index) => {
      const x = data.length > 1 ? index * stepX : this.chartWidth / 2;
      // y is inverted because SVG coordinate system starts at top left
      const y = this.chartHeight - ((point.actual / scaleMax) * this.chartHeight);
      
      return {
        x,
        y,
        value: point.actual,
        label: formatMonthShort(point.month)
      };
    });
  });

  trendPath = computed(() => {
    const points = this.chartPoints();
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M 0,${points[0].y} L ${this.chartWidth},${points[0].y}`;
    }
    
    // Generate SVG path for a line
    return points.reduce((path, point, index) => {
      return index === 0 
        ? `M ${point.x},${point.y}` 
        : `${path} L ${point.x},${point.y}`;
    }, '');
  });

  trendAreaPath = computed(() => {
    const points = this.chartPoints();
    if (points.length === 0) return '';
    
    let path = this.trendPath();
    // Add points to close the path for the area
    path += ` L ${points[points.length - 1].x},${this.chartHeight}`;
    path += ` L ${points[0].x},${this.chartHeight} Z`;
    
    return path;
  });

  onRangeChange(range: DateRange) {
    this.currentRange.set(range);
  }

  formatDisplayMonth(m: string | undefined): string {
    if (!m) return '';
    return formatMonth(m);
  }

  downloadReport() {
    const data = this.reportData();
    if (!data) return;

    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Headers
      csvContent += "Investment Name,Total Planned,Total Actual,Average Monthly,Months Active\\n";
      
      // Rows
      data.investmentSummaries.forEach(summary => {
        const row = [
          `"${summary.investmentName}"`,
          summary.totalPlanned,
          summary.totalActual,
          summary.averageMonthly,
          summary.monthCount
        ].join(",");
        csvContent += row + "\\n";
      });

      // Overall Summary
      csvContent += "\\n\\nOverall Summary\\n";
      csvContent += `Period,"${formatMonth(data.fromMonth)} to ${formatMonth(data.toMonth)}"\\n`;
      csvContent += `Total Planned,${data.totalPlanned}\\n`;
      csvContent += `Total Actual,${data.totalActual}\\n`;
      csvContent += `Average Monthly,${data.averageMonthlyActual}\\n`;

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `investory-report-${data.fromMonth}-to-${data.toMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.toast.success("Report downloaded successfully");
    } catch (e: any) {
      this.toast.error("Failed to download report");
      console.error(e);
    }
  }
}
