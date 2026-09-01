import { Injectable, inject } from '@angular/core';
import {
  AppData,
  InvestmentComponent,
  MonthlyInvestment,
} from '../models/investment.model';
import { SupabaseService } from './supabase.service';

interface ComponentRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  default_monthly_amount: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface MonthlyRow {
  id: string;
  user_id: string;
  month: string;
  investments: MonthlyInvestment['investments'];
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class InvestmentRepository {
  private supabase = inject(SupabaseService);

  async fetchAll(
    userId: string
  ): Promise<{ data: AppData | null; error: string | null }> {
    if (!this.supabase.isConfigured) {
      return { data: null, error: 'Supabase is not configured' };
    }

    const client = this.supabase.getClient();
    const [componentsRes, monthlyRes, metaRes] = await Promise.all([
      client
        .from('investment_components')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      client
        .from('monthly_investments')
        .select('*')
        .eq('user_id', userId)
        .order('month', { ascending: true }),
      client
        .from('user_sync_meta')
        .select('updated_at, data_version')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    if (componentsRes.error) {
      return { data: null, error: componentsRes.error.message };
    }
    if (monthlyRes.error) {
      return { data: null, error: monthlyRes.error.message };
    }

    const components = (componentsRes.data as ComponentRow[]).map((row) =>
      this.mapComponentFromRow(row)
    );
    const monthly = (monthlyRes.data as MonthlyRow[]).map((row) =>
      this.mapMonthlyFromRow(row)
    );
    const updatedAt =
      metaRes.data?.updated_at ??
      this.latestTimestamp(components) ??
      new Date().toISOString();

    return {
      data: {
        version: metaRes.data?.data_version ?? 1,
        investmentComponents: components,
        monthlyInvestments: monthly,
        exportedAt: new Date().toISOString(),
        updatedAt,
      },
      error: null,
    };
  }

  async hasCloudData(userId: string): Promise<boolean> {
    if (!this.supabase.isConfigured) return false;
    const client = this.supabase.getClient();
    const { count, error } = await client
      .from('investment_components')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) return false;
    if ((count ?? 0) > 0) return true;

    const monthly = await client
      .from('monthly_investments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    return (monthly.count ?? 0) > 0;
  }

  async getCloudUpdatedAt(userId: string): Promise<string | null> {
    if (!this.supabase.isConfigured) return null;
    const { data } = await this.supabase
      .getClient()
      .from('user_sync_meta')
      .select('updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.updated_at ?? null;
  }

  async replaceAll(
    userId: string,
    data: AppData
  ): Promise<{ error: string | null }> {
    if (!this.supabase.isConfigured) {
      return { error: 'Supabase is not configured' };
    }

    const client = this.supabase.getClient();
    const now = data.updatedAt ?? new Date().toISOString();

    await client.from('profiles').upsert({ id: userId, updated_at: now });

    const componentRows = data.investmentComponents.map((c) =>
      this.mapComponentToRow(c, userId, now)
    );
    const monthlyRows = data.monthlyInvestments.map((m) =>
      this.mapMonthlyToRow(m, userId, now)
    );

    const { data: existingComponents, error: existingCompErr } = await client
      .from('investment_components')
      .select('id')
      .eq('user_id', userId);
    if (existingCompErr) return { error: existingCompErr.message };

    const keepComponentIds = new Set(data.investmentComponents.map((c) => c.id));
    const deleteComponentIds = (existingComponents ?? [])
      .map((r: { id: string }) => r.id)
      .filter((id: string) => !keepComponentIds.has(id));

    if (deleteComponentIds.length > 0) {
      const { error } = await client
        .from('investment_components')
        .delete()
        .eq('user_id', userId)
        .in('id', deleteComponentIds);
      if (error) return { error: error.message };
    }

    if (componentRows.length > 0) {
      const { error } = await client
        .from('investment_components')
        .upsert(componentRows, { onConflict: 'user_id,id' });
      if (error) return { error: error.message };
    }

    const { data: existingMonthly, error: existingMonthErr } = await client
      .from('monthly_investments')
      .select('id')
      .eq('user_id', userId);
    if (existingMonthErr) return { error: existingMonthErr.message };

    const keepMonthlyIds = new Set(data.monthlyInvestments.map((m) => m.id));
    const deleteMonthlyIds = (existingMonthly ?? [])
      .map((r: { id: string }) => r.id)
      .filter((id: string) => !keepMonthlyIds.has(id));

    if (deleteMonthlyIds.length > 0) {
      const { error } = await client
        .from('monthly_investments')
        .delete()
        .eq('user_id', userId)
        .in('id', deleteMonthlyIds);
      if (error) return { error: error.message };
    }

    if (monthlyRows.length > 0) {
      const { error } = await client
        .from('monthly_investments')
        .upsert(monthlyRows, { onConflict: 'user_id,id' });
      if (error) return { error: error.message };
    }

    const { error: metaError } = await client.from('user_sync_meta').upsert({
      user_id: userId,
      updated_at: now,
      data_version: data.version ?? 1,
    });
    if (metaError) return { error: metaError.message };

    return { error: null };
  }

  async clearAll(userId: string): Promise<{ error: string | null }> {
    if (!this.supabase.isConfigured) return { error: null };
    const client = this.supabase.getClient();
    const [c, m, meta] = await Promise.all([
      client.from('investment_components').delete().eq('user_id', userId),
      client.from('monthly_investments').delete().eq('user_id', userId),
      client.from('user_sync_meta').delete().eq('user_id', userId),
    ]);
    return {
      error: c.error?.message || m.error?.message || meta.error?.message || null,
    };
  }

  private mapComponentFromRow(row: ComponentRow): InvestmentComponent {
    return {
      id: row.id,
      name: row.name,
      type: row.type ?? '',
      defaultMonthlyAmount: Number(row.default_monthly_amount) || 0,
      active: !!row.active,
      createdAt: row.created_at,
    };
  }

  private mapComponentToRow(
    c: InvestmentComponent,
    userId: string,
    updatedAt: string
  ): ComponentRow {
    return {
      id: c.id,
      user_id: userId,
      name: c.name,
      type: c.type ?? '',
      default_monthly_amount: c.defaultMonthlyAmount,
      active: c.active,
      created_at: c.createdAt,
      updated_at: updatedAt,
    };
  }

  private mapMonthlyFromRow(row: MonthlyRow): MonthlyInvestment {
    return {
      id: row.id,
      month: row.month,
      investments: Array.isArray(row.investments) ? row.investments : [],
    };
  }

  private mapMonthlyToRow(
    m: MonthlyInvestment,
    userId: string,
    updatedAt: string
  ): MonthlyRow {
    return {
      id: m.id,
      user_id: userId,
      month: m.month,
      investments: m.investments,
      created_at: updatedAt,
      updated_at: updatedAt,
    };
  }

  private latestTimestamp(components: InvestmentComponent[]): string | null {
    const dates = components.map((c) => c.createdAt).filter(Boolean);
    if (dates.length === 0) return null;
    return dates.sort().at(-1) ?? null;
  }
}
