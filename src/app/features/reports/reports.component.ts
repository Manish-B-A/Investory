import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalculationService } from '../../core/services/calculation.service';
import { MonthlyService } from '../../core/services/monthly.service';
import { ReportService } from '../../core/services/report.service';
import { PdfReportService } from '../../core/services/pdf-report.service';
import { ToastService } from '../../core/services/toast.service';
import { InvestmentTypeReport } from '../../core/models/investment.model';
import {
  DateRangeSelectorComponent,
  DateRange,
} from '../../shared/components/date-range-selector/date-range-selector.component';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { InvestmentChartComponent } from '../../shared/components/investment-chart/investment-chart.component';
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
    InvestmentChartComponent,
    InrCurrencyPipe,
  ],
  template: `
    <div class="reports-container fade-in">
      @if (selectedReport(); as report) {
        <!-- Detail view -->
        <header class="page-header detail-header">
          <div class="detail-header-left">
            <button class="btn btn-ghost" type="button" (click)="closeDetail()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 3L5 8L10 13"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Back
            </button>
            <div>
              <h1 class="page-title">{{ report.investmentName }}</h1>
              <p class="subtitle">{{ report.investmentType }}</p>
            </div>
          </div>
          <button
            class="btn btn-secondary"
            type="button"
            (click)="downloadPdf()"
            [disabled]="pdfBusy()"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style="margin-right: 8px; vertical-align: text-bottom;"
            >
              <path
                d="M14 11V14H2V11M8 2V11M8 11L4.5 7.5M8 11L11.5 7.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            {{ pdfBusy() ? 'Generating…' : 'Download PDF' }}
          </button>
        </header>

        <section class="metrics-grid">
          <app-summary-card
            label="Total Invested"
            [value]="report.totalInvested"
            [isCurrency]="true"
            [accent]="true"
          />
          <app-summary-card
            label="Contributions"
            [value]="report.contributionCount"
          />
          <app-summary-card
            label="Average"
            [value]="report.averageContribution"
            [isCurrency]="true"
          />
          <app-summary-card
            label="Duration"
            [value]="report.durationMonths"
            [subtitle]="durationSubtitle(report)"
          />
        </section>

        <section class="card chart-section">
          <div class="chart-section-header">
            <h2 class="card-title">Investment Graph</h2>
            <div class="chart-mode-toggle">
              <button
                type="button"
                class="toggle-btn"
                [class.active]="detailMode() === 'contribution'"
                (click)="detailMode.set('contribution')"
              >
                Contribution
              </button>
              <button
                type="button"
                class="toggle-btn"
                [class.active]="detailMode() === 'cumulative'"
                (click)="detailMode.set('cumulative')"
              >
                Cumulative
              </button>
            </div>
          </div>
          <div class="large-chart-host" #largeChartHost>
            <app-investment-chart
              [series]="report.series"
              [mode]="detailMode()"
              [showPlanned]="true"
              [large]="true"
              chartId="detail"
            />
          </div>
        </section>

        <section class="analysis-grid">
          @if (report.analysis.overview.length) {
            <div class="card analysis-card">
              <h2 class="card-title">Overview</h2>
              <ul class="analysis-list">
                @for (line of report.analysis.overview; track line) {
                  <li>{{ line }}</li>
                }
              </ul>
            </div>
          }
          @if (report.analysis.trends.length) {
            <div class="card analysis-card">
              <h2 class="card-title">Trends</h2>
              <ul class="analysis-list">
                @for (line of report.analysis.trends; track line) {
                  <li>{{ line }}</li>
                }
              </ul>
            </div>
          }
          @if (report.analysis.performance.length) {
            <div class="card analysis-card">
              <h2 class="card-title">Performance</h2>
              <ul class="analysis-list">
                @for (line of report.analysis.performance; track line) {
                  <li>{{ line }}</li>
                }
              </ul>
            </div>
          }
        </section>
      } @else {
        <!-- List view -->
        <header class="page-header">
          <div>
            <h1 class="page-title">Reports</h1>
            <p class="subtitle">Per-investment insights and overall trends</p>
          </div>
        </header>

        <!-- Section A: Investment Reports -->
        <section class="section">
          <h2 class="section-title">Investment Reports</h2>

          @if (investmentReports().length === 0) {
            <app-empty-state
              title="No investment reports yet"
              message="Mark monthly contributions as invested to generate per-investment reports."
              icon="chart"
            />
          } @else {
            <div class="report-cards-grid">
              @for (item of investmentReports(); track item.investmentId) {
                <button
                  type="button"
                  class="report-card"
                  (click)="openDetail(item.investmentId)"
                >
                  <div class="report-card-top">
                    <div>
                      <h3 class="report-card-name">{{ item.investmentName }}</h3>
                      <p class="report-card-type">{{ item.investmentType }}</p>
                    </div>
                    <div class="report-card-stats">
                      <span class="stat-value">{{ item.totalInvested | inr }}</span>
                      <span class="stat-label"
                        >{{ item.contributionCount }} contribution{{
                          item.contributionCount === 1 ? '' : 's'
                        }}</span
                      >
                    </div>
                  </div>
                  <app-investment-chart
                    [series]="item.series"
                    mode="cumulative"
                    [chartId]="item.investmentId"
                  />
                </button>
              }
            </div>
          }
        </section>

        <!-- Section B: Overall trends -->
        <section class="section">
          <div class="section-header-row">
            <h2 class="section-title">Overall Trends</h2>
            <button
              class="btn btn-secondary"
              type="button"
              (click)="downloadReport()"
              [disabled]="!reportData() || reportData()!.monthlyTrend.length === 0"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style="margin-right: 8px; vertical-align: text-bottom;"
              >
                <path
                  d="M14 11V14H2V11M8 2V11M8 11L4.5 7.5M8 11L11.5 7.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Export CSV
            </button>
          </div>

          <div class="filters-section card">
            <app-date-range-selector
              [earliestMonth]="earliestMonth()"
              (rangeChange)="onRangeChange($event)"
            />
          </div>

          @if (reportData() && reportData()!.monthlyTrend.length > 0) {
            <div class="metrics-grid">
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
            </div>

            <div class="card chart-section">
              <h2 class="card-title">Investment Trend</h2>
              <div class="chart-container">
                <svg
                  class="trend-chart"
                  [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight"
                  preserveAspectRatio="none"
                >
                  @for (line of [0, 1, 2, 3, 4]; track line) {
                    <line
                      x1="0"
                      [attr.y1]="chartHeight - line * (chartHeight / 4)"
                      [attr.x2]="chartWidth"
                      [attr.y2]="chartHeight - line * (chartHeight / 4)"
                      stroke="var(--border-primary)"
                      stroke-dasharray="4 4"
                    />
                  }
                  <path
                    [attr.d]="trendPath()"
                    fill="none"
                    stroke="var(--accent)"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path [attr.d]="trendAreaPath()" fill="url(#areaGradient)" />
                  @for (point of chartPoints(); track point.x) {
                    <circle
                      [attr.cx]="point.x"
                      [attr.cy]="point.y"
                      r="4"
                      fill="var(--bg-surface)"
                      stroke="var(--accent)"
                      stroke-width="2"
                    >
                      <title>{{ point.label }}: {{ point.value | inr }}</title>
                    </circle>
                  }
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.3" />
                      <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div class="x-axis">
                  @for (point of chartPoints(); track point.x; let i = $index) {
                    @if (
                      chartPoints().length <= 6 ||
                      i % Math.ceil(chartPoints().length / 6) === 0 ||
                      i === chartPoints().length - 1
                    ) {
                      <span
                        class="x-label"
                        [style.left.%]="(point.x / chartWidth) * 100"
                        >{{ point.label }}</span
                      >
                    }
                  }
                </div>
              </div>
            </div>

            <div class="card breakdown-section">
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
                    @for (
                      summary of reportData()!.investmentSummaries;
                      track summary.investmentId
                    ) {
                      <tr>
                        <td class="font-medium">{{ summary.investmentName }}</td>
                        <td class="text-right num-cell">
                          {{ summary.totalPlanned | inr }}
                        </td>
                        <td class="text-right num-cell font-semibold text-primary">
                          {{ summary.totalActual | inr }}
                        </td>
                        <td class="text-right num-cell">
                          {{ summary.averageMonthly | inr }}
                        </td>
                        <td class="text-right num-cell">{{ summary.monthCount }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          } @else {
            <app-empty-state
              title="Not enough data"
              message="There are no investment records for the selected time range. Try selecting a different range or start tracking your investments."
              icon="chart"
            />
          }
        </section>
      }
    </div>
  `,
  styles: [
    `
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

      .detail-header-left {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
        align-items: flex-start;
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

      .section {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
      }

      .section-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-md);
      }

      .section-title {
        font-size: var(--font-lg);
        font-weight: var(--weight-semibold);
        color: var(--text-primary);
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

        &.btn-ghost {
          background: transparent;
          color: var(--text-secondary);
          border: none;
          padding: var(--space-xs) 0;
          gap: 4px;

          &:hover {
            color: var(--text-primary);
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

      .report-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--space-lg);
      }

      .report-card {
        text-align: left;
        background: var(--bg-surface);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-lg);
        padding: var(--space-lg);
        cursor: pointer;
        transition: border-color var(--transition-fast),
          background var(--transition-fast);
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
        color: inherit;
        font: inherit;

        &:hover {
          border-color: var(--accent);
          background: var(--bg-surface-hover);
        }
      }

      .report-card-top {
        display: flex;
        justify-content: space-between;
        gap: var(--space-md);
        align-items: flex-start;
      }

      .report-card-name {
        font-size: var(--font-md);
        font-weight: var(--weight-semibold);
        color: var(--text-primary);
        margin: 0 0 2px;
      }

      .report-card-type {
        font-size: var(--font-sm);
        color: var(--text-secondary);
        margin: 0;
      }

      .report-card-stats {
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .stat-value {
        font-size: var(--font-md);
        font-weight: var(--weight-semibold);
        color: var(--accent-text);
        font-variant-numeric: tabular-nums;
      }

      .stat-label {
        font-size: var(--font-xs);
        color: var(--text-tertiary);
      }

      .chart-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-md);
        margin-bottom: var(--space-md);

        .card-title {
          margin-bottom: 0;
        }
      }

      .chart-mode-toggle {
        display: inline-flex;
        background: var(--bg-elevated);
        border-radius: var(--radius-md);
        padding: 2px;
        border: 1px solid var(--border-primary);
      }

      .toggle-btn {
        border: none;
        background: transparent;
        color: var(--text-secondary);
        font-size: var(--font-xs);
        font-weight: var(--weight-medium);
        padding: var(--space-xs) var(--space-md);
        border-radius: calc(var(--radius-md) - 2px);
        cursor: pointer;

        &.active {
          background: var(--accent-subtle);
          color: var(--accent-text);
        }
      }

      .large-chart-host {
        width: 100%;
      }

      .analysis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--space-lg);
      }

      .analysis-list {
        margin: 0;
        padding-left: var(--space-lg);
        color: var(--text-secondary);
        font-size: var(--font-sm);
        line-height: 1.6;

        li + li {
          margin-top: var(--space-sm);
        }
      }

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

      .table-container {
        overflow-x: auto;
      }

      .investment-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;

        th,
        td {
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

      .text-right {
        text-align: right;
      }
      .num-cell {
        font-variant-numeric: tabular-nums;
      }
      .font-medium {
        font-weight: var(--weight-medium);
      }
      .font-semibold {
        font-weight: var(--weight-semibold);
      }
      .text-primary {
        color: var(--text-primary);
      }
    `,
  ],
})
export class ReportsComponent {
  private calcService = inject(CalculationService);
  private monthlyService = inject(MonthlyService);
  private reportService = inject(ReportService);
  private pdfService = inject(PdfReportService);
  private toast = inject(ToastService);

  @ViewChild('largeChartHost') largeChartHost?: ElementRef<HTMLElement>;

  Math = Math;

  selectedId = signal<string | null>(null);
  detailMode = signal<'contribution' | 'cumulative'>('cumulative');
  pdfBusy = signal(false);
  currentRange = signal<DateRange | null>(null);

  investmentReports = computed(() => this.reportService.getInvestmentTypeReports());

  selectedReport = computed(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.reportService.getInvestmentTypeReport(id);
  });

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

  chartWidth = 800;
  chartHeight = 240;

  chartPoints = computed(() => {
    const data = this.reportData()?.monthlyTrend || [];
    if (data.length === 0) return [];

    const maxVal = Math.max(...data.map((d) => d.actual), 100);
    const scaleMax = maxVal * 1.1;
    const stepX =
      data.length > 1 ? this.chartWidth / (data.length - 1) : this.chartWidth / 2;

    return data.map((point, index) => {
      const x = data.length > 1 ? index * stepX : this.chartWidth / 2;
      const y = this.chartHeight - (point.actual / scaleMax) * this.chartHeight;
      return {
        x,
        y,
        value: point.actual,
        label: formatMonthShort(point.month),
      };
    });
  });

  trendPath = computed(() => {
    const points = this.chartPoints();
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M 0,${points[0].y} L ${this.chartWidth},${points[0].y}`;
    }
    return points.reduce(
      (path, point, index) =>
        index === 0 ? `M ${point.x},${point.y}` : `${path} L ${point.x},${point.y}`,
      ''
    );
  });

  trendAreaPath = computed(() => {
    const points = this.chartPoints();
    if (points.length === 0) return '';
    let path = this.trendPath();
    path += ` L ${points[points.length - 1].x},${this.chartHeight}`;
    path += ` L ${points[0].x},${this.chartHeight} Z`;
    return path;
  });

  openDetail(id: string): void {
    this.selectedId.set(id);
    this.detailMode.set('cumulative');
  }

  closeDetail(): void {
    this.selectedId.set(null);
  }

  durationSubtitle(report: InvestmentTypeReport): string {
    if (report.firstMonth && report.lastMonth) {
      return `${formatMonthShort(report.firstMonth)} – ${formatMonthShort(report.lastMonth)}`;
    }
    return 'months with contributions';
  }

  onRangeChange(range: DateRange): void {
    this.currentRange.set(range);
  }

  formatDisplayMonth(m: string | undefined): string {
    if (!m) return '';
    return formatMonth(m);
  }

  async downloadPdf(): Promise<void> {
    const report = this.selectedReport();
    if (!report || this.pdfBusy()) return;

    this.pdfBusy.set(true);
    try {
      await this.pdfService.downloadInvestmentReport(
        report,
        this.largeChartHost?.nativeElement ?? null
      );
      this.toast.success('PDF downloaded');
    } catch (e) {
      console.error(e);
      this.toast.error('Failed to generate PDF');
    } finally {
      this.pdfBusy.set(false);
    }
  }

  downloadReport(): void {
    const data = this.reportData();
    if (!data) return;

    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent +=
        'Investment Name,Total Planned,Total Actual,Average Monthly,Months Active\n';

      data.investmentSummaries.forEach((summary) => {
        const row = [
          `"${summary.investmentName}"`,
          summary.totalPlanned,
          summary.totalActual,
          summary.averageMonthly,
          summary.monthCount,
        ].join(',');
        csvContent += row + '\n';
      });

      csvContent += '\n\nOverall Summary\n';
      csvContent += `Period,"${formatMonth(data.fromMonth)} to ${formatMonth(data.toMonth)}"\n`;
      csvContent += `Total Planned,${data.totalPlanned}\n`;
      csvContent += `Total Actual,${data.totalActual}\n`;
      csvContent += `Average Monthly,${data.averageMonthlyActual}\n`;

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `investory-report-${data.fromMonth}-to-${data.toMonth}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.toast.success('Report downloaded successfully');
    } catch (e) {
      this.toast.error('Failed to download report');
      console.error(e);
    }
  }
}
