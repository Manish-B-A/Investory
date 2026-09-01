export interface InvestmentComponent {
  id: string;
  name: string;
  type: string;
  defaultMonthlyAmount: number;
  active: boolean;
  createdAt: string;
}

export interface MonthlyInvestment {
  id: string;
  month: string; // YYYY-MM
  investments: MonthlyInvestmentEntry[];
}

export interface MonthlyInvestmentEntry {
  investmentId: string;
  plannedAmount: number;
  actualAmount: number | null;
  invested: boolean;
}

export interface AppData {
  version: number;
  investmentComponents: InvestmentComponent[];
  monthlyInvestments: MonthlyInvestment[];
  exportedAt: string;
  updatedAt?: string;
}

export interface InvestmentReportSeriesPoint {
  month: string;
  contribution: number;
  cumulative: number;
  planned: number;
}

export interface InvestmentReportAnalysis {
  overview: string[];
  trends: string[];
  performance: string[];
}

/** One dynamic report card/detail per investment component that has data. */
export interface InvestmentTypeReport {
  investmentId: string;
  investmentName: string;
  investmentType: string;
  totalInvested: number;
  contributionCount: number;
  monthCount: number;
  averageContribution: number;
  highestContribution: { month: string; amount: number } | null;
  lowestContribution: { month: string; amount: number } | null;
  firstMonth: string | null;
  lastMonth: string | null;
  durationMonths: number;
  series: InvestmentReportSeriesPoint[];
  analysis: InvestmentReportAnalysis;
}

export interface MonthlyStats {
  month: string;
  totalPlanned: number;
  totalActual: number;
  difference: number;
  entries: MonthlyEntryWithName[];
}

export interface MonthlyEntryWithName extends MonthlyInvestmentEntry {
  investmentName: string;
  investmentActive: boolean;
}

export interface InvestmentSummary {
  investmentId: string;
  investmentName: string;
  totalPlanned: number;
  totalActual: number;
  averageMonthly: number;
  monthCount: number;
}

export interface ReportData {
  fromMonth: string;
  toMonth: string;
  totalPlanned: number;
  totalActual: number;
  averageMonthlyPlanned: number;
  averageMonthlyActual: number;
  highestMonth: { month: string; amount: number } | null;
  lowestMonth: { month: string; amount: number } | null;
  investmentSummaries: InvestmentSummary[];
  monthlyTrend: { month: string; planned: number; actual: number }[];
}

export const SEED_INVESTMENTS: InvestmentComponent[] = [
  {
    id: 'ppf-001',
    name: 'PPF',
    type: 'Provident Fund',
    defaultMonthlyAmount: 12000,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'sip-001',
    name: 'SIP',
    type: 'Mutual Fund',
    defaultMonthlyAmount: 6000,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'gold-001',
    name: 'Gold',
    type: 'Commodity',
    defaultMonthlyAmount: 25000,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];
