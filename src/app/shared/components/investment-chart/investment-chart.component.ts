import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvestmentReportSeriesPoint } from '../../../core/models/investment.model';
import { InrCurrencyPipe } from '../../pipes/inr-currency.pipe';
import { formatMonthShort } from '../../../core/utilities/helpers';

export type ChartMode = 'contribution' | 'cumulative';

@Component({
  selector: 'app-investment-chart',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe],
  template: `
    <div class="chart-wrap" [class.large]="large">
      @if (series.length === 0) {
        <div class="empty">No chart data</div>
      } @else {
        <div class="legend">
          <span class="legend-item">
            <i class="swatch contribution"></i>
            {{ mode === 'cumulative' ? 'Cumulative invested' : 'Contribution' }}
          </span>
          @if (showPlanned && mode === 'contribution') {
            <span class="legend-item">
              <i class="swatch planned"></i>
              Planned
            </span>
          }
        </div>

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

            @if (showPlanned && mode === 'contribution' && plannedPath()) {
              <path
                [attr.d]="plannedPath()"
                fill="none"
                stroke="var(--text-tertiary)"
                stroke-width="2"
                stroke-dasharray="6 4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            }

            <path [attr.d]="areaPath()" [attr.fill]="'url(#' + gradientId + ')'" />
            <path
              [attr.d]="linePath()"
              fill="none"
              stroke="var(--accent)"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            @for (point of points(); track point.x) {
              <circle
                [attr.cx]="point.x"
                [attr.cy]="point.y"
                [attr.r]="large ? 5 : 4"
                fill="var(--bg-surface)"
                stroke="var(--accent)"
                stroke-width="2"
              >
                <title>{{ point.label }}: {{ point.value | inr }}</title>
              </circle>
            }

            <defs>
              <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.3" />
                <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <div class="x-axis">
            @for (point of points(); track point.x; let i = $index) {
              @if (
                points().length <= 6 ||
                i % Math.ceil(points().length / 6) === 0 ||
                i === points().length - 1
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
      }
    </div>
  `,
  styles: [
    `
      .chart-wrap {
        width: 100%;
      }
      .empty {
        color: var(--text-secondary);
        font-size: var(--font-sm);
        padding: var(--space-xl);
        text-align: center;
      }
      .legend {
        display: flex;
        gap: var(--space-md);
        margin-bottom: var(--space-sm);
        flex-wrap: wrap;
      }
      .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: var(--font-xs);
        color: var(--text-secondary);
      }
      .swatch {
        width: 12px;
        height: 3px;
        border-radius: 2px;
        display: inline-block;
      }
      .swatch.contribution {
        background: var(--accent);
      }
      .swatch.planned {
        background: var(--text-tertiary);
      }
      .chart-container {
        position: relative;
        width: 100%;
        height: 220px;
        margin-bottom: var(--space-md);
      }
      .large .chart-container {
        height: 360px;
      }
      .trend-chart {
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .x-axis {
        position: absolute;
        bottom: -22px;
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
    `,
  ],
})
export class InvestmentChartComponent implements OnChanges {
  @Input() series: InvestmentReportSeriesPoint[] = [];
  @Input() mode: ChartMode = 'contribution';
  @Input() showPlanned = false;
  @Input() large = false;
  @Input() chartId = 'chart';

  Math = Math;
  chartWidth = 800;
  chartHeight = 240;

  private seriesSignal = signal<InvestmentReportSeriesPoint[]>([]);
  private modeSignal = signal<ChartMode>('contribution');
  gradientId = 'areaGradient-chart';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['series']) this.seriesSignal.set(this.series ?? []);
    if (changes['mode']) this.modeSignal.set(this.mode);
    if (changes['chartId']) this.gradientId = `areaGradient-${this.chartId}`;
  }

  points = computed(() => {
    const data = this.seriesSignal();
    const mode = this.modeSignal();
    if (data.length === 0) return [];

    const values = data.map((d) =>
      mode === 'cumulative' ? d.cumulative : d.contribution
    );
    const maxVal = Math.max(...values, 100);
    const scaleMax = maxVal * 1.1;
    const stepX =
      data.length > 1 ? this.chartWidth / (data.length - 1) : this.chartWidth / 2;

    return data.map((point, index) => {
      const value =
        mode === 'cumulative' ? point.cumulative : point.contribution;
      const x = data.length > 1 ? index * stepX : this.chartWidth / 2;
      const y = this.chartHeight - (value / scaleMax) * this.chartHeight;
      return {
        x,
        y,
        value,
        label: formatMonthShort(point.month),
      };
    });
  });

  linePath = computed(() => {
    const pts = this.points();
    if (pts.length === 0) return '';
    if (pts.length === 1) {
      return `M 0,${pts[0].y} L ${this.chartWidth},${pts[0].y}`;
    }
    return pts.reduce(
      (path, point, index) =>
        index === 0
          ? `M ${point.x},${point.y}`
          : `${path} L ${point.x},${point.y}`,
      ''
    );
  });

  areaPath = computed(() => {
    const pts = this.points();
    if (pts.length === 0) return '';
    let path = this.linePath();
    path += ` L ${pts[pts.length - 1].x},${this.chartHeight}`;
    path += ` L ${pts[0].x},${this.chartHeight} Z`;
    return path;
  });

  plannedPath = computed(() => {
    const data = this.seriesSignal();
    if (data.length === 0) return '';
    const maxVal = Math.max(
      ...data.map((d) => Math.max(d.contribution, d.planned)),
      100
    );
    const scaleMax = maxVal * 1.1;
    const stepX =
      data.length > 1 ? this.chartWidth / (data.length - 1) : this.chartWidth / 2;

    return data.reduce((path, point, index) => {
      const x = data.length > 1 ? index * stepX : this.chartWidth / 2;
      const y =
        this.chartHeight - (point.planned / scaleMax) * this.chartHeight;
      return index === 0 ? `M ${x},${y}` : `${path} L ${x},${y}`;
    }, '');
  });
}
