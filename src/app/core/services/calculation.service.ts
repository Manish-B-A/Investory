import { Injectable, inject } from '@angular/core';
import {
  MonthlyInvestment,
  MonthlyEntryWithName,
  MonthlyStats,
  ReportData,
  InvestmentSummary,
} from '../models/investment.model';
import { InvestmentService } from './investment.service';
import { MonthlyService } from './monthly.service';

@Injectable({ providedIn: 'root' })
export class CalculationService {
  private investmentService = inject(InvestmentService);
  private monthlyService = inject(MonthlyService);

  getMonthlyStats(month: string): MonthlyStats | null {
    const record = this.monthlyService.getOrCreateMonth(month);
    if (!record) return null;

    const entries = this.enrichEntries(record);
    const totalPlanned = entries.reduce((s, e) => s + e.plannedAmount, 0);
    const totalActual = entries.reduce(
      (s, e) => s + (e.invested ? (e.actualAmount ?? e.plannedAmount) : 0),
      0
    );

    return {
      month,
      totalPlanned,
      totalActual,
      difference: totalActual - totalPlanned,
      entries,
    };
  }

  getCurrentMonthProgress(month: string): {
    actual: number;
    planned: number;
    percentage: number;
  } {
    const stats = this.getMonthlyStats(month);
    if (!stats) {
      const planned = this.investmentService.totalDefaultMonthly();
      return { actual: 0, planned, percentage: 0 };
    }
    const percentage =
      stats.totalPlanned > 0
        ? Math.round((stats.totalActual / stats.totalPlanned) * 1000) / 10
        : 0;
    return {
      actual: stats.totalActual,
      planned: stats.totalPlanned,
      percentage: Math.min(percentage, 100),
    };
  }

  getTotalInvested(): number {
    return this.monthlyService.records().reduce((total, record) => {
      return (
        total +
        record.investments.reduce(
          (s, e) => s + (e.invested ? (e.actualAmount ?? e.plannedAmount) : 0),
          0
        )
      );
    }, 0);
  }

  getMonthlyAverage(): number {
    const records = this.monthlyService.records();
    if (records.length === 0) return 0;
    const total = this.getTotalInvested();
    return Math.round(total / records.length);
  }

  getReportData(from: string, to: string): ReportData {
    const records = this.monthlyService.getMonthsInRange(from, to);

    const monthlyTrend: { month: string; planned: number; actual: number }[] =
      [];
    let totalPlanned = 0;
    let totalActual = 0;
    let highestMonth: { month: string; amount: number } | null = null;
    let lowestMonth: { month: string; amount: number } | null = null;

    const investmentTotals = new Map<
      string,
      { planned: number; actual: number; count: number }
    >();

    for (const record of records) {
      let monthPlanned = 0;
      let monthActual = 0;

      for (const entry of record.investments) {
        monthPlanned += entry.plannedAmount;
        const actual = entry.invested ? (entry.actualAmount ?? entry.plannedAmount) : 0;
        monthActual += actual;

        const existing = investmentTotals.get(entry.investmentId) ?? {
          planned: 0,
          actual: 0,
          count: 0,
        };
        investmentTotals.set(entry.investmentId, {
          planned: existing.planned + entry.plannedAmount,
          actual: existing.actual + actual,
          count: existing.count + 1,
        });
      }

      totalPlanned += monthPlanned;
      totalActual += monthActual;

      monthlyTrend.push({
        month: record.month,
        planned: monthPlanned,
        actual: monthActual,
      });

      if (!highestMonth || monthActual > highestMonth.amount) {
        highestMonth = { month: record.month, amount: monthActual };
      }
      if (!lowestMonth || monthActual < lowestMonth.amount) {
        lowestMonth = { month: record.month, amount: monthActual };
      }
    }

    const monthCount = records.length || 1;
    const investmentSummaries: InvestmentSummary[] = [];

    investmentTotals.forEach((totals, investmentId) => {
      const component = this.investmentService.getById(investmentId);
      investmentSummaries.push({
        investmentId,
        investmentName: component?.name ?? 'Unknown',
        totalPlanned: totals.planned,
        totalActual: totals.actual,
        averageMonthly: Math.round(totals.actual / totals.count),
        monthCount: totals.count,
      });
    });

    return {
      fromMonth: from,
      toMonth: to,
      totalPlanned,
      totalActual,
      averageMonthlyPlanned: Math.round(totalPlanned / monthCount),
      averageMonthlyActual: Math.round(totalActual / monthCount),
      highestMonth,
      lowestMonth,
      investmentSummaries,
      monthlyTrend,
    };
  }

  getInvestmentPercentages(
    month: string
  ): { name: string; amount: number; percentage: number }[] {
    const stats = this.getMonthlyStats(month);
    if (!stats || stats.totalActual === 0) return [];

    return stats.entries.map((e) => {
      const amount = e.invested ? (e.actualAmount ?? e.plannedAmount) : 0;
      return {
        name: e.investmentName,
        amount,
        percentage:
          Math.round((amount / stats.totalActual) * 1000) / 10,
      };
    });
  }

  private enrichEntries(record: MonthlyInvestment): MonthlyEntryWithName[] {
    return record.investments.map((entry) => {
      const component = this.investmentService.getById(entry.investmentId);
      return {
        ...entry,
        investmentName: component?.name ?? 'Unknown',
        investmentActive: component?.active ?? false,
      };
    });
  }
}
