'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import {
  HandCoins, Plus, Search, Eye, ChevronLeft, ChevronRight, FileSpreadsheet, Loader2, AlertCircle, X,
} from 'lucide-react';
import { getVouchers, getBillSettings, getCompanies, ApiError, type GetVouchersParams, type VouchersResponse } from '@/lib/api';
import type { ApiCompany, ApiVoucher } from '@/lib/types';
import { withDefaultLogo } from '@/lib/billStamp';
import { formatBillDate, formatBillNumber, formatNpr, PAYMENT_MODE_LABELS } from '@/lib/billing';
import { exportVoucherRegister } from '@/lib/voucherExport';

const PER_PAGE = 10;

export default function VouchersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApiVoucher['status'] | 'all'>('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    getCompanies({ perPage: 500 }).then((res) => setCompanies(res.data)).catch(() => {});
  }, []);

  const filters: GetVouchersParams = {
    search: debouncedSearch || undefined,
    company: companyFilter || undefined,
    status: statusFilter,
    from: from || undefined,
    to: to || undefined,
  };

  // Each response is tagged with the query it answers, so "loading" is simply
  // "the latest result isn't for the current query yet".
  const queryKey = JSON.stringify({ ...filters, page });
  const [result, setResult] = useState<
    { key: string; data?: VouchersResponse; error?: string } | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    const key = queryKey;
    getVouchers({ ...(JSON.parse(key) as GetVouchersParams), perPage: PER_PAGE })
      .then((data) => { if (!cancelled) setResult({ key, data }); })
      .catch((err) => {
        if (!cancelled) setResult({ key, error: err instanceof ApiError ? err.message : 'Could not reach the CourierDesk API' });
      });
    return () => { cancelled = true; };
  }, [queryKey]);

  const loading = result?.key !== queryKey;
  const error = !loading ? result?.error ?? null : null;
  const vouchers = result?.data?.data ?? [];
  const total = result?.data?.pagination.total ?? 0;
  const totalPages = result?.data?.pagination.totalPages ?? 1;
  const summary = result?.data?.summary ?? null;

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
      setPage(1);
    }, 400);
  }

  function clearDates() {
    setFrom('');
    setTo('');
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const [res, settings] = await Promise.all([
        getVouchers({ ...filters, page: 1, perPage: 5000 }),
        getBillSettings().then((r) => withDefaultLogo(r.data)),
      ]);
      if (res.data.length === 0) {
        setExportError('No vouchers match the current filters.');
        return;
      }
      await exportVoucherRegister(res.data, { from: from || undefined, to: to || undefined }, settings);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : 'Failed to export vouchers.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppLayout activePath="/vouchers">
      <div className="max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Payment Vouchers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Record payments to partner courier companies for your expense accounts</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-600 hover:bg-muted transition-colors disabled:opacity-60"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              Expense register
            </button>
            <Link
              href="/vouchers/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} /> New Voucher
            </Link>
          </div>
        </div>

        {exportError && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle size={14} className="shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search voucher no., company, AWB, their bill no..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={companyFilter}
            onChange={(e) => { setCompanyFilter(e.target.value); setPage(1); }}
            aria-label="Partner company"
            className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 max-w-[220px]"
          >
            <option value="">All companies</option>
            {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              aria-label="From date"
              className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              aria-label="To date"
              className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {(from || to) && (
              <button onClick={clearDates} aria-label="Clear dates" className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {(['all', 'issued', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-2 text-xs font-600 rounded-lg capitalize transition-colors ${
                  statusFilter === s ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Vouchers (filtered)', value: loading && !summary ? '—' : String(total) },
            { label: 'Issued vouchers', value: summary ? String(summary.issuedCount) : '—' },
            { label: 'Total paid (Rs.)', value: summary ? formatNpr(summary.issuedAmount) : '—' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-700 mt-1 text-foreground tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Voucher No.</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Paid To</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Mode</th>
                  <th className="text-right px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Paid (Rs.)</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td colSpan={7} className="px-5 py-4">
                        <div className="h-4 bg-muted rounded animate-pulse w-full" />
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-danger text-sm">{error}</td></tr>
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">
                      No payment vouchers found.{' '}
                      <Link href="/vouchers/new" className="text-primary font-600 hover:underline">Record the first payment</Link>
                    </td>
                  </tr>
                ) : (
                  vouchers.map((v) => (
                    <tr
                      key={v._id}
                      onClick={() => router.push(`/vouchers/${v._id}`)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <HandCoins size={16} className="text-primary" />
                          </div>
                          <span className="font-600 text-foreground tabular-nums">#{formatBillNumber(v.voucherNumber)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">{formatBillDate(v.voucherDate)}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-500 text-foreground">{v.payee.name}</p>
                        {(v.supplierBillNo || v.againstBillNo) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[v.supplierBillNo && `Their bill ${v.supplierBillNo}`, v.againstBillNo && `for our bill #${formatBillNumber(v.againstBillNo)}`].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">{PAYMENT_MODE_LABELS[v.paymentMode]}</td>
                      <td className={`px-5 py-3.5 text-right font-600 tabular-nums ${v.status === 'cancelled' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {formatNpr(v.total)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-600 ${
                          v.status === 'issued' ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
                        }`}>
                          {v.status === 'issued' ? 'Issued' : 'Cancelled'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/vouchers/${v._id}`}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`View voucher ${formatBillNumber(v.voucherNumber)}`}
                          className="inline-flex p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Eye size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">{total} vouchers</p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"><ChevronLeft size={14} /></button>
              <span className="text-xs font-600">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
