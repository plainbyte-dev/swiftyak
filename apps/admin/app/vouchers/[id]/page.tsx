'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import VoucherDocument from '@/components/bills/VoucherDocument';
import {
  ArrowLeft, Printer, FileSpreadsheet, FileDown, Share2, Ban, Loader2, AlertCircle, X, Plus, Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { getVoucher, getBills, getBillSettings, getMe, cancelVoucher, ApiError } from '@/lib/api';
import type { ApiVoucher, BillSettings } from '@/lib/types';
import { formatBillDate, formatBillNumber, formatNpr } from '@/lib/billing';
import { exportVoucherToExcel } from '@/lib/voucherExport';
import { renderBillPdf, downloadBlob, shareFile } from '@/lib/billPdf';
import { withDefaultLogo } from '@/lib/billStamp';

type Busy = 'pdf' | 'share' | 'excel' | null;

export default function VoucherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const docRef = useRef<HTMLElement>(null);
  const [voucher, setVoucher] = useState<ApiVoucher | null>(null);
  const [linkedBillId, setLinkedBillId] = useState<string | null>(null);
  const [settings, setSettings] = useState<BillSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getVoucher(id), getBillSettings().then((res) => withDefaultLogo(res.data))])
      .then(([voucherRes, resolvedSettings]) => {
        if (cancelled) return;
        setVoucher(voucherRes.data);
        setSettings(resolvedSettings);
        // Resolve "for our bill #N" to a link.
        const n = voucherRes.data.againstBillNo;
        if (n) {
          getBills({ search: String(n), perPage: 20 })
            .then((res) => { if (!cancelled) setLinkedBillId(res.data.find((b) => b.billNumber === n)?._id ?? null); })
            .catch(() => {});
        }
      })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load this voucher.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    getMe()
      .then((res) => { if (!cancelled) setIsAdmin(res.user.role === 'admin'); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  const fileBase = voucher
    ? `Payment-Voucher-${formatBillNumber(voucher.voucherNumber)}-${voucher.payee.name.replace(/[^\w]+/g, '-').replace(/-+$/, '')}`
    : 'Payment-Voucher';
  const preparedBy = voucher && typeof voucher.createdBy === 'object' ? voucher.createdBy.name : null;

  async function makePdf() {
    if (!docRef.current) throw new Error('Voucher is not ready yet');
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
    if (!voucher || !settings) return;
    setBusy('share');
    try {
      const pdf = await makePdf();
      const text = `${settings.businessName} — Payment Voucher No. ${formatBillNumber(voucher.voucherNumber)}: Rs. ${formatNpr(voucher.total)} paid to ${voucher.payee.name}`;
      const shared = await shareFile(pdf, `${fileBase}.pdf`, text);
      if (!shared) {
        // Desktop browsers usually can't share files — download it so it can be attached instead.
        downloadBlob(pdf, `${fileBase}.pdf`);
        toast.info('PDF downloaded — attach it in WhatsApp, Viber or email to share.');
      }
    } catch {
      toast.error('Could not share the voucher. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function handleExcel() {
    if (!voucher || !settings) return;
    setBusy('excel');
    try {
      await exportVoucherToExcel(voucher, settings);
    } catch {
      toast.error('Could not create the Excel file.');
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    if (!voucher) return;
    if (!cancelReason.trim()) {
      setCancelError('Please give a reason for cancelling this voucher.');
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      const { data } = await cancelVoucher(voucher._id, cancelReason.trim());
      setVoucher(data);
      setCancelOpen(false);
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : 'Failed to cancel the voucher.');
    } finally {
      setCancelling(false);
    }
  }

  const cancelledVoucher = voucher?.status === 'cancelled';
  const btn = 'flex items-center gap-2 px-3.5 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-600 hover:bg-muted transition-colors disabled:opacity-60';

  return (
    <AppLayout activePath="/vouchers">
      {/* Print just the voucher, edge to edge on A4 */}
      <style>{'@media print { @page { size: A4; margin: 0; } }'}</style>

      <div className="max-w-[796px] mx-auto space-y-5">
        {/* Toolbar (hidden when printing) */}
        <div className="flex flex-col gap-4 print:hidden">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Link href="/vouchers" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
                <ArrowLeft size={13} /> Back to vouchers
              </Link>
              <h1 className="text-2xl font-700 text-foreground">
                {voucher ? `Payment Voucher #${formatBillNumber(voucher.voucherNumber)}` : 'Payment Voucher'}
              </h1>
              {voucher && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {voucher.payee.name} · {formatBillDate(voucher.voucherDate)}
                  {voucher.againstBillNo && (
                    <>
                      {' · for '}
                      {linkedBillId ? (
                        <Link href={`/bills/${linkedBillId}`} className="text-primary hover:underline">bill #{formatBillNumber(voucher.againstBillNo)}</Link>
                      ) : (
                        <>bill #{formatBillNumber(voucher.againstBillNo)}</>
                      )}
                    </>
                  )}
                </p>
              )}
            </div>
            <Link href="/vouchers/new" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 transition-colors shrink-0">
              <Plus size={16} /> New Voucher
            </Link>
          </div>
          {voucher && settings && (
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
              <div className="flex-1" />
              {linkedBillId && (
                <Link href={`/bills/${linkedBillId}`} className={btn}>
                  <Receipt size={16} /> Customer bill
                </Link>
              )}
              {isAdmin && !cancelledVoucher && (
                <button onClick={() => { setCancelOpen(true); setCancelReason(''); setCancelError(null); }} className="flex items-center gap-2 px-3.5 py-2 bg-card border border-destructive/40 text-destructive rounded-lg text-sm font-600 hover:bg-destructive/10 transition-colors">
                  <Ban size={16} /> Cancel voucher
                </button>
              )}
            </div>
          )}
        </div>

        {cancelledVoucher && (
          <div role="status" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive print:hidden">
            <Ban size={14} className="shrink-0 mt-0.5" />
            <span>
              This voucher was cancelled{voucher?.cancelledAt ? ` on ${formatBillDate(voucher.cancelledAt)}` : ''}. Reason: {voucher?.cancelReason}
            </span>
          </div>
        )}

        {loading ? (
          <div className="h-[900px] bg-card border border-border rounded-xl animate-pulse" />
        ) : error || !voucher || !settings ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error ?? 'Voucher not found.'}</span>
          </div>
        ) : (
          <div className="w-fit max-w-full mx-auto overflow-x-auto rounded-xl border border-border shadow-card print:overflow-visible print:border-0 print:shadow-none print:rounded-none">
            <VoucherDocument ref={docRef} voucher={voucher} settings={settings} preparedBy={preparedBy} />
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-700 text-foreground">Cancel voucher #{voucher && formatBillNumber(voucher.voucherNumber)}</h2>
              <button onClick={() => setCancelOpen(false)} aria-label="Close" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Cancelled vouchers stay in the expense register (marked as cancelled) so voucher numbers remain continuous. This can&apos;t be undone.
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
              <button onClick={() => setCancelOpen(false)} disabled={cancelling} className="px-4 py-2 text-sm font-600 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">Keep voucher</button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-2 px-5 py-2 text-sm font-600 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-60"
              >
                {cancelling && <Loader2 size={14} className="animate-spin" />}
                {cancelling ? 'Cancelling…' : 'Cancel voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
