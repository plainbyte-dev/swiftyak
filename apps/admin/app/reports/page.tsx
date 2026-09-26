'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { TrendingUp, TrendingDown, Package, Truck, CheckCircle, Clock, AlertCircle, Building2, Calendar, Download, ChevronDown, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  getReportsSummary, getVolumeTrend, getCompanyPerformance, getCourierLeaderboard,
  ApiError,
} from '@/lib/api';
import type {
  ReportsSummary, VolumeDataPoint, CompanyPerformance, CourierPerformance, ReportPeriod,
} from '@/lib/types';

const AreaChart = dynamic(() => import('recharts').then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then((m) => m.Area), { ssr: false });
const BarChartComp = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false });

const PERIODS: { label: string; value: ReportPeriod }[] = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last 3 Months', value: 'quarter' },
  { label: 'This Year', value: 'year' },
];

function formatCurrency(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <AlertCircle size={14} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [periodOpen, setPeriodOpen] = useState(false);

  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [volume, setVolume] = useState<VolumeDataPoint[]>([]);
  const [companies, setCompanies] = useState<CompanyPerformance[]>([]);
  const [couriers, setCouriers] = useState<CourierPerformance[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPeriodLabel = PERIODS.find((p) => p.value === period)?.label ?? 'This Week';

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, volumeRes, companiesRes, couriersRes] = await Promise.all([
        getReportsSummary(period),
        getVolumeTrend(period),
        getCompanyPerformance(period),
        getCourierLeaderboard(period),
      ]);
      setSummary(summaryRes.data);
      setVolume(volumeRes.data);
      setCompanies(companiesRes.data);
      setCouriers(couriersRes.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the CourierDesk API');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const kpis = summary
    ? [
        { label: 'Total Shipments', value: summary.totalShipments.toLocaleString(), change: `${summary.totalShipmentsChangePct >= 0 ? '+' : ''}${summary.totalShipmentsChangePct}%`, up: summary.totalShipmentsChangePct >= 0, icon: <Package size={18} />, color: 'text-primary bg-primary/10' },
        { label: 'Delivered', value: summary.delivered.toLocaleString(), change: `${summary.deliveredChangePct >= 0 ? '+' : ''}${summary.deliveredChangePct}%`, up: summary.deliveredChangePct >= 0, icon: <CheckCircle size={18} />, color: 'text-success bg-success/10' },
        { label: 'On-Time Rate', value: `${summary.onTimeRate}%`, change: `${summary.onTimeRateChangePct >= 0 ? '+' : ''}${summary.onTimeRateChangePct}%`, up: summary.onTimeRateChangePct >= 0, icon: <Clock size={18} />, color: 'text-info bg-info/10' },
        { label: 'Failed / Cancelled', value: summary.failedOrCancelled.toLocaleString(), change: `${summary.failedChangePct >= 0 ? '+' : ''}${summary.failedChangePct}%`, up: summary.failedChangePct >= 0, icon: <AlertCircle size={18} />, color: 'text-destructive bg-destructive/10' },
        { label: 'Active Couriers', value: summary.activeCouriers.toLocaleString(), change: `${summary.activeCouriersChange >= 0 ? '+' : ''}${summary.activeCouriersChange}`, up: summary.activeCouriersChange >= 0, icon: <Truck size={18} />, color: 'text-warning bg-warning/10' },
        { label: 'Partner Companies', value: summary.partnerCompanies.toLocaleString(), change: `${summary.partnerCompaniesChange >= 0 ? '+' : ''}${summary.partnerCompaniesChange}`, up: summary.partnerCompaniesChange >= 0, icon: <Building2 size={18} />, color: 'text-primary bg-primary/10' },
      ]
    : [];

  const sortedCouriers = [...couriers].sort((a, b) => b.deliveries - a.deliveries);

  return (
    <AppLayout activePath="/reports">
      <div className="max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Performance analytics across companies, couriers, and shipments</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setPeriodOpen((p) => !p)}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-600 hover:bg-muted transition-colors"
              >
                <Calendar size={15} className="text-muted-foreground" />
                {currentPeriodLabel}
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
              {periodOpen && (
                <div className="absolute right-0 top-10 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px]">
                  {PERIODS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => { setPeriod(p.value); setPeriodOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${period === p.value ? 'text-primary font-600' : 'text-foreground'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 transition-colors">
              <Download size={15} /> Export
            </button>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`kpi-skel-${i}`} className="bg-card border border-border rounded-xl p-4">
                <div className="h-9 w-9 rounded-lg bg-muted animate-pulse mb-3" />
                <div className="h-6 w-14 bg-muted rounded animate-pulse mb-1.5" />
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              </div>
            ))
          ) : (
            kpis.map((kpi) => (
              <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${kpi.color}`}>{kpi.icon}</div>
                <p className="text-2xl font-700 text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
                <div className={`flex items-center gap-1 mt-1.5 text-xs font-600 ${kpi.up ? 'text-success' : 'text-destructive'}`}>
                  {kpi.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {kpi.change}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shipment Volume */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-700 text-foreground mb-4">Shipment Volume — {currentPeriodLabel}</h3>
            <div className="h-52 flex items-center justify-center">
              {loading ? (
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              ) : volume.length === 0 ? (
                <p className="text-sm text-muted-foreground">No shipment data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volume} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="shipments" stroke="var(--primary)" strokeWidth={2} fill="url(#colorShipments)" name="Total" />
                    <Area type="monotone" dataKey="delivered" stroke="var(--success)" strokeWidth={2} fill="url(#colorDelivered)" name="Delivered" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Company Shipments */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-700 text-foreground mb-4">Shipments by Company</h3>
            <div className="h-52 flex items-center justify-center">
              {loading ? (
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              ) : companies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No company data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChartComp data={companies} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <XAxis dataKey="company" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="shipments" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Shipments" />
                  </BarChartComp>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Performance */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-700 text-foreground">Company Performance</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground">Company</th>
                  <th className="text-right px-5 py-3 text-xs font-600 text-muted-foreground">Shipments</th>
                  <th className="text-right px-5 py-3 text-xs font-600 text-muted-foreground">On-Time</th>
                  <th className="text-right px-5 py-3 text-xs font-600 text-muted-foreground">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`co-skel-${i}`}>
                      <td colSpan={4} className="px-5 py-3.5">
                        <div className="h-4 bg-muted rounded animate-pulse w-full" />
                      </td>
                    </tr>
                  ))
                ) : companies.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-sm">No data for this period</td></tr>
                ) : (
                  companies.map((co) => (
                    <tr key={co.companyId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-600 text-foreground">{co.company}</td>
                      <td className="px-5 py-3 text-right text-foreground">{co.shipments.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`font-600 ${co.onTime >= 95 ? 'text-success' : co.onTime >= 90 ? 'text-warning' : 'text-destructive'}`}>{co.onTime}%</span>
                      </td>
                      <td className="px-5 py-3 text-right font-600 text-foreground">{formatCurrency(co.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Courier Leaderboard */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-700 text-foreground">Courier Leaderboard</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground">#</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground">Courier</th>
                  <th className="text-right px-5 py-3 text-xs font-600 text-muted-foreground">Deliveries</th>
                  <th className="text-right px-5 py-3 text-xs font-600 text-muted-foreground">On-Time</th>
                  <th className="text-right px-5 py-3 text-xs font-600 text-muted-foreground">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`cr-skel-${i}`}>
                      <td colSpan={5} className="px-5 py-3.5">
                        <div className="h-4 bg-muted rounded animate-pulse w-full" />
                      </td>
                    </tr>
                  ))
                ) : sortedCouriers.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-sm">No data for this period</td></tr>
                ) : (
                  sortedCouriers.map((courier, idx) => (
                    <tr key={courier.courierId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 text-xs font-700 text-muted-foreground">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</td>
                      <td className="px-5 py-3 font-600 text-foreground">{courier.name}</td>
                      <td className="px-5 py-3 text-right text-foreground">{courier.deliveries.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`font-600 ${courier.onTime >= 95 ? 'text-success' : 'text-warning'}`}>{courier.onTime}%</span>
                      </td>
                      <td className="px-5 py-3 text-right font-600 text-foreground">⭐ {courier.rating}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {periodOpen && <div className="fixed inset-0 z-10" onClick={() => setPeriodOpen(false)} />}
    </AppLayout>
  );
}