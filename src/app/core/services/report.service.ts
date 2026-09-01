import { Injectable, inject } from '@angular/core';
import {
  InvestmentComponent,
  InvestmentReportAnalysis,
  InvestmentReportSeriesPoint,
  InvestmentTypeReport,
  MonthlyInvestment,
} from '../models/investment.model';
import { InvestmentService } from './investment.service';
import { MonthlyService } from './monthly.service';
import { formatMonth } from '../utilities/helpers';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private investmentService = inject(InvestmentService);
  private monthlyService = inject(MonthlyService);

  /** Dynamically builds one report per investment that has invested data. */
  getInvestmentTypeReports(): InvestmentTypeReport[] {
    const components = this.investmentService.components();
    const records = this.monthlyService.records();

    return components
      .map((c) => this.buildFor(c, records))
      .filter((r): r is InvestmentTypeReport => r !== null)
      .sort((a, b) => b.totalInvested - a.totalInvested);
  }

  getInvestmentTypeReport(id: string): InvestmentTypeReport | null {
    const component = this.investmentService.getById(id);
    if (!component) return null;
    return this.buildFor(component, this.monthlyService.records());
  }

  private buildFor(
    component: InvestmentComponent,
    records: readonly MonthlyInvestment[]
  ): InvestmentTypeReport | null {
    const series: InvestmentReportSeriesPoint[] = [];
    let totalInvested = 0;
    let contributionCount = 0;
    let highest: { month: string; amount: number } | null = null;
    let lowest: { month: string; amount: number } | null = null;

    const sorted = [...records].sort((a, b) => a.month.localeCompare(b.month));

    for (const record of sorted) {
      const entry = record.investments.find(
        (i) => i.investmentId === component.id
      );
      if (!entry?.invested) continue;

      const contribution = entry.actualAmount ?? entry.plannedAmount;
      contributionCount += 1;
      totalInvested += contribution;
      series.push({
        month: record.month,
        contribution,
        cumulative: totalInvested,
        planned: entry.plannedAmount,
      });

      if (!highest || contribution > highest.amount) {
        highest = { month: record.month, amount: contribution };
      }
      if (!lowest || contribution < lowest.amount) {
        lowest = { month: record.month, amount: contribution };
      }
    }

    if (contributionCount === 0) return null;

    const averageContribution = Math.round(totalInvested / contributionCount);
    const firstMonth = series[0]?.month ?? null;
    const lastMonth = series[series.length - 1]?.month ?? null;

    return {
      investmentId: component.id,
      investmentName: component.name,
      investmentType: component.type || 'Investment',
      totalInvested,
      contributionCount,
      monthCount: series.length,
      averageContribution,
      highestContribution: highest,
      lowestContribution: lowest,
      firstMonth,
      lastMonth,
      durationMonths: series.length,
      series,
      analysis: this.buildAnalysis({
        name: component.name,
        series,
        totalInvested,
        contributionCount,
        averageContribution,
        highest,
        lowest,
        firstMonth,
        lastMonth,
        durationMonths: series.length,
      }),
    };
  }

  private buildAnalysis(input: {
    name: string;
    series: InvestmentReportSeriesPoint[];
    totalInvested: number;
    contributionCount: number;
    averageContribution: number;
    highest: { month: string; amount: number } | null;
    lowest: { month: string; amount: number } | null;
    firstMonth: string | null;
    lastMonth: string | null;
    durationMonths: number;
  }): InvestmentReportAnalysis {
    const overview: string[] = [];
    const trends: string[] = [];
    const performance: string[] = [];

    overview.push(
      `You have invested a total of ₹${this.n(input.totalInvested)} across ${input.contributionCount} contribution${input.contributionCount === 1 ? '' : 's'} in ${input.name}.`
    );
    if (input.firstMonth && input.lastMonth) {
      overview.push(
        `Tracking period: ${formatMonth(input.firstMonth)} to ${formatMonth(input.lastMonth)} (${input.durationMonths} month${input.durationMonths === 1 ? '' : 's'} with contributions).`
      );
    }
    overview.push(`Average contribution: ₹${this.n(input.averageContribution)}.`);

    if (input.series.length >= 2) {
      const first = input.series[0].contribution;
      const last = input.series[input.series.length - 1].contribution;
      const change = last - first;
      const pct = first > 0 ? Math.round((change / first) * 1000) / 10 : null;

      if (change > 0 && pct !== null) {
        trends.push(
          `Your ${input.name} contributions increased from ₹${this.n(first)} to ₹${this.n(last)} (${pct}% higher than the first recorded contribution).`
        );
      } else if (change < 0 && pct !== null) {
        trends.push(
          `Your ${input.name} contributions decreased from ₹${this.n(first)} to ₹${this.n(last)} (${Math.abs(pct)}% lower than the first recorded contribution).`
        );
      } else {
        trends.push(
          `Your ${input.name} contributions remained steady at ₹${this.n(first)} across the recorded period.`
        );
      }

      const prev = input.series[input.series.length - 2].contribution;
      const curr = input.series[input.series.length - 1].contribution;
      const mom = curr - prev;
      if (mom !== 0) {
        const momPct = prev > 0 ? Math.round((mom / prev) * 1000) / 10 : null;
        trends.push(
          `Most recent month-over-month contribution ${mom > 0 ? 'increased' : 'decreased'} by ₹${this.n(Math.abs(mom))}${momPct !== null ? ` (${Math.abs(momPct)}%)` : ''}.`
        );
      }

      let rising = 0;
      let falling = 0;
      for (let i = 1; i < input.series.length; i++) {
        const d = input.series[i].contribution - input.series[i - 1].contribution;
        if (d > 0) rising++;
        if (d < 0) falling++;
      }
      const half = Math.ceil((input.series.length - 1) / 2);
      if (rising > falling && rising >= half) {
        trends.push(
          `${input.name} contributions have increased in most recorded intervals.`
        );
      } else if (falling > rising && falling >= half) {
        trends.push(
          `${input.name} contributions have decreased in most recorded intervals.`
        );
      }
    }

    if (input.highest) {
      performance.push(
        `Highest contribution: ₹${this.n(input.highest.amount)} in ${formatMonth(input.highest.month)}.`
      );
    }
    if (
      input.lowest &&
      input.highest &&
      input.lowest.month !== input.highest.month
    ) {
      performance.push(
        `Lowest contribution: ₹${this.n(input.lowest.amount)} in ${formatMonth(input.lowest.month)}.`
      );
    }
    if (input.series.length >= 1) {
      performance.push(
        `Cumulative invested amount reached ₹${this.n(input.totalInvested)} by ${input.lastMonth ? formatMonth(input.lastMonth) : 'the latest month'}.`
      );
    }

    return { overview, trends, performance };
  }

  private n(value: number): string {
    const abs = Math.abs(Math.round(value)).toString();
    if (abs.length <= 3) return abs;
    const last3 = abs.slice(-3);
    let rest = abs.slice(0, -3);
    const groups: string[] = [];
    while (rest.length > 2) {
      groups.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest) groups.unshift(rest);
    return `${groups.join(',')},${last3}`;
  }
}
