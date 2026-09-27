'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import BillDocument, { type BillCopy } from '@/components/bills/BillDocument';
import {
  ArrowLeft, Printer, FileSpreadsheet, FileDown, Share2, Ban, Loader2, AlertCircle, X, Plus, Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getBill, getBillSettings, getMe, cancelBill, ApiError } from '@/lib/api';
import type { ApiBill, BillSettings } from '@/lib/types';
import { exportBillToExcel, formatBillDate, formatBillNumber, formatNpr } from '@/lib/billing';
import { renderBillPdf, downloadBlob, shareFile } from '@/lib/billPdf';
import { withDefaultLogo } from '@/lib/billStamp';

type Busy = 'pdf' | 'share' | 'excel' | null;

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const docRef = useRef<HTMLElement>(null);
  const [bill, setBill] = useState<ApiBill | null>(null);
  const [settings, setSettings] = useState<BillSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [copy, setCopy] = useState<BillCopy>('customer');

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getBill(id), getBillSettings().then((res) => withDefaultLogo(res.data))])
      .then(([billRes, resolvedSettings]) => {
        if (cancelled) return;
        setBill(billRes.data);
        setSettings(resolvedSettings);
      })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load this bill.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    getMe()
      .then((res) => { if (!cancelled) setIsAdmin(res.user.role === 'admin'); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  const fileBase = bill
    ? `Bill-${formatBillNumber(bill.billNumber)}-${bill.customer.name.replace(/[^\w]+/g, '-').replace(/-+$/, '')}${copy === 'office' ? '-office-copy' : ''}`
    : 'Bill';
  const preparedBy = bill && typeof bill.createdBy === 'object' ? bill.createdBy.name : null;

  async function makePdf() {
    if (!docRef.current) throw new Error('Bill is not ready yet');
    return renderBillPdf(docRef.current);
  }

  async function handleDownloadPdf() {
    setBusy('pdf');
    try {
      downloadBlob(await makePdf(), `${fileBase}.pdf`);
    } catch {
      toast.error('Could not create the PDF. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    if (!bill || !settings) return;
    setBusy('share');
    try {
      const pdf = await makePdf();
      const text = `${settings.businessName} — Bill No. ${formatBillNumber(bill.billNumber)} for Rs. ${formatNpr(bill.total)}`;
      const shared = await shareFile(pdf, `${fileBase}.pdf`, text);
      if (!shared) {
        // Desktop browsers usually can't share files — download it so it can be attached instead.
        downloadBlob(pdf, `${fileBase}.pdf`);
        toast.info('PDF downloaded — attach it in WhatsApp, Viber or email to share.');
      }
    } catch {
      toast.error('Could not share the bill. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function handleExcel() {
    if (!bill || !settings) return;
    setBusy('excel');
    try {
      await exportBillToExcel(bill, settings, copy);
    } catch {
      toast.error('Could not create the Excel file.');
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    if (!bill) return;
    if (!cancelReason.trim()) {
      setCancelError('Please give a reason for cancelling this bill.');
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      const { data } = await cancelBill(bill._id, cancelReason.trim());
      setBill(data);
      setCancelOpen(false);
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : 'Failed to cancel the bill.');
    } finally {
      setCancelling(false);
    }
  }

  const cancelledBill = bill?.status === 'cancelled';
  const btn = 'flex items-center gap-2 px-3.5 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-600 hover:bg-muted transition-colors disabled:opacity-60';

  return (
    <AppLayout activePath="/bills">
      {/* Print just the bill, edge to edge on A4 */}
      <style>{'@media print { @page { size: A4; margin: 0; } }'}</style>

      <div className="max-w-[796px] mx-auto space-y-5">
        {/* Toolbar (hidden when printing) */}
        <div className="flex flex-col gap-4 print:hidden">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Link href="/bills" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
                <ArrowLeft size={13} /> Back to bills
              </Link>
              <h1 className="text-2xl font-700 text-foreground">
                {bill ? `Bill #${formatBillNumber(bill.billNumber)}` : 'Bill'}
              </h1>
              {bill && <p className="text-sm text-muted-foreground mt-0.5">{bill.customer.name} · {formatBillDate(bill.billDate)}</p>}
            </div>
            <Link href="/bills/new" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 transition-colors shrink-0">
              <Plus size={16} /> New Bill
            </Link>
          </div>
          {bill && settings && (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleShare} disabled={!!busy} className="flex items-center gap-2 px-3.5 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 transition-colors disabled:opacity-60">
                {busy === 'share' ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} Share
              </button>
              <button onClick={handleDownloadPdf} disabled={!!busy} className={btn}>
                {busy === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} PDF
              </button>
              <button onClick={() => window.print()} disabled={!!busy} className={btn}>
                <Printer size={16} /> Print
              </button>
              <button onClick={handleExcel} disabled={!!busy} className={btn}>
                {busy === 'excel' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />} Excel
              </button>
              <div role="radiogroup" aria-label="Bill copy" className="flex rounded-lg border border-border bg-card p-0.5 text-xs font-600">
                {([['customer', 'Customer copy'], ['office', 'Office copy']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    role="radio"
                    aria-checked={copy === value}
                    onClick={() => setCopy(value)}
                    className={`px-3 py-1.5 rounded-md transition-colors ${copy === value ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              {isAdmin && (
                <Link href="/bills/settings" className={btn}>
                  <Settings2 size={16} /> Bill format
                </Link>
              )}
              {isAdmin && !cancelledBill && (
                <button onClick={() => { setCancelOpen(true); setCancelReason(''); setCancelError(null); }} className="flex items-center gap-2 px-3.5 py-2 bg-card border border-destructive/40 text-destructive rounded-lg text-sm font-600 hover:bg-destructive/10 transition-colors">
                  <Ban size={16} /> Cancel bill
                </button>
              )}
            </div>
          )}
        </div>

        {cancelledBill && (
          <div role="status" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive print:hidden">
            <Ban size={14} className="shrink-0 mt-0.5" />
            <span>
              This bill was cancelled{bill?.cancelledAt ? ` on ${formatBillDate(bill.cancelledAt)}` : ''}. Reason: {bill?.cancelReason}
            </span>
          </div>
        )}

        {loading ? (
          <div className="h-[900px] bg-card border border-border rounded-xl animate-pulse" />
        ) : error || !bill || !settings ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error ?? 'Bill not found.'}</span>
          </div>
        ) : (
          <div className="w-fit max-w-full mx-auto overflow-x-auto rounded-xl border border-border shadow-card print:overflow-visible print:border-0 print:shadow-none print:rounded-none">
            <BillDocument ref={docRef} bill={bill} settings={settings} copy={copy} preparedBy={preparedBy} />
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-700 text-foreground">Cancel bill #{bill && formatBillNumber(bill.billNumber)}</h2>
              <button onClick={() => setCancelOpen(false)} aria-label="Close" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Cancelled bills stay in the register (marked as cancelled) so bill numbers remain continuous. This can&apos;t be undone.
              </p>
              {cancelError && (
                <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{cancelError}</span>
                </div>
              )}
              <div>
                <label htmlFor="cancel-reason" className="block text-xs font-600 text-muted-foreground mb-1.5">Reason *</label>
                <textarea
                  id="cancel-reason"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Wrong amount entered, re-issued as #0012"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setCancelOpen(false)} disabled={cancelling} className="px-4 py-2 text-sm font-600 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">Keep bill</button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-2 px-5 py-2 text-sm font-600 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-60"
              >
                {cancelling && <Loader2 size={14} className="animate-spin" />}
                {cancelling ? 'Cancelling…' : 'Cancel bill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
