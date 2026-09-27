'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle, Copy } from 'lucide-react';
import BillPicker from '@/components/bills/BillPicker';
import { createVoucher, getCompanies, getVouchers, ApiError } from '@/lib/api';
import type { ApiBill, ApiCompany, PaymentMode } from '@/lib/types';
import { amountInWords, fiscalYear, formatBillNumber, formatBsDate, formatNpr, PAYMENT_MODE_LABELS } from '@/lib/billing';

interface ItemRow {
  key: number;
  awb: string;
  from: string;
  to: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
}

let nextKey = 1;
const emptyItem = (): ItemRow => ({ key: nextKey++, awb: '', from: '', to: '', description: '', quantity: '1', unit: '', rate: '' });

function todayLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const inputClass =
  'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function NewVoucherPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<ApiCompany[] | null>(null);
  const [companyId, setCompanyId] = useState('');
  const [payee, setPayee] = useState({ pan: '', address: '', phone: '' });
  const [voucherDate, setVoucherDate] = useState(todayLocal);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('bank');
  const [paymentRef, setPaymentRef] = useState('');
  const [supplierBillNo, setSupplierBillNo] = useState('');
  const [againstBill, setAgainstBill] = useState<ApiBill | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [items, setItems] = useState<ItemRow[]>(() => [emptyItem()]);
  const [otherCharges, setOtherCharges] = useState('');
  const [discount, setDiscount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCompanies({ perPage: 500 })
      .then((res) => { if (!cancelled) setCompanies(res.data); })
      .catch(() => { if (!cancelled) setCompanies([]); });
    return () => { cancelled = true; };
  }, []);

  const lineAmount = (item: ItemRow) => round2((Number(item.quantity) || 0) * (Number(item.rate) || 0));
  const subtotal = round2(items.reduce((sum, item) => sum + lineAmount(item), 0));
  const otherNum = round2(Number(otherCharges) || 0);
  const gross = round2(subtotal + otherNum);
  const discountNum = round2(Number(discount) || 0);
  const total = round2(Math.max(0, gross - discountNum));

  async function chooseCompany(id: string) {
    setCompanyId(id);
    if (error) setError(null);
    const company = companies?.find((c) => c._id === id);
    if (!company) return;
    setPayee({ pan: '', address: company.address ?? '', phone: company.phone ?? '' });
    // Companies don't store a PAN — reuse the one from the last voucher paid to them.
    try {
      const last = await getVouchers({ company: id, perPage: 1 });
      const pan = last.data[0]?.payee.pan;
      if (pan) setPayee((p) => ({ ...p, pan: p.pan || pan }));
    } catch {
      // Non-fatal: the PAN can be typed in.
    }
  }

  function updateItem(key: number, field: keyof Omit<ItemRow, 'key'>, value: string) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
    if (error) setError(null);
  }

  function removeItem(key: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.key !== key) : prev));
  }

  /** Pull the consignments from our customer bill so only the courier's rates need entering. */
  function copyFromBill(bill: ApiBill) {
    setItems(
      bill.items.map((item) => ({
        key: nextKey++,
        awb: item.awb,
        from: item.from,
        to: item.to,
        description: item.description,
        quantity: String(item.quantity),
        unit: item.unit,
        rate: '',
      }))
    );
    setCopyNote(`Copied ${bill.items.length} consignment${bill.items.length === 1 ? '' : 's'} from bill #${formatBillNumber(bill.billNumber)}. Enter the courier's rates.`);
  }

  function chooseBill(bill: ApiBill | null) {
    setAgainstBill(bill);
    setCopyNote(null);
    if (error) setError(null);
    // Fill the consignments straight away if nothing has been typed yet.
    const untouched = items.every((item) => !item.awb && !item.description && !item.from && !item.to && !item.rate);
    if (bill && untouched) copyFromBill(bill);
  }

  function validate(): string | null {
    if (!companyId) return 'Choose the partner company that was paid.';
    if (payee.pan.trim() && !/^\d{9}$/.test(payee.pan.trim())) return 'PAN must be exactly 9 digits.';
    if (!voucherDate) return 'Voucher date is required.';
    for (const [i, item] of items.entries()) {
      if (!item.description.trim()) return `Item ${i + 1}: enter a description.`;
      if (!(Number(item.quantity) > 0)) return `Item ${i + 1}: quantity must be greater than 0.`;
      if (item.rate === '' || !(Number(item.rate) >= 0)) return `Item ${i + 1}: enter a valid rate.`;
    }
    if (otherNum < 0) return 'Charges cannot be negative.';
    if (discountNum < 0 || discountNum > gross) return 'Discount must be between 0 and the total.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { data } = await createVoucher({
        company: companyId,
        voucherDate,
        payee: {
          pan: payee.pan.trim() || undefined,
          address: payee.address.trim(),
          phone: payee.phone.trim(),
        },
        items: items.map((item) => ({
          awb: item.awb.trim() || undefined,
          from: item.from.trim() || undefined,
          to: item.to.trim() || undefined,
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unit: item.unit.trim() || undefined,
          rate: Number(item.rate),
        })),
        otherCharges: otherNum,
        discount: discountNum,
        paymentMode,
        paymentRef: paymentRef.trim() || undefined,
        supplierBillNo: supplierBillNo.trim() || undefined,
        againstBillNo: againstBill?.billNumber,
        remarks: remarks.trim() || undefined,
      });
      router.push(`/vouchers/${data._id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save the voucher. Please try again.');
      setSaving(false);
    }
  }

  return (
    <AppLayout activePath="/vouchers">
      <form onSubmit={handleSubmit} noValidate className="max-w-screen-lg mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/vouchers" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft size={13} /> Back to vouchers
          </Link>
          <h1 className="text-2xl font-700 text-foreground">New Payment Voucher</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Record what you paid a partner courier company. The voucher number is assigned when you save.</p>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Payee + payment details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-700 text-foreground">Paid to</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="v-company" className="block text-xs font-600 text-muted-foreground mb-1.5">Partner company *</label>
                <select
                  id="v-company"
                  value={companyId}
                  onChange={(e) => chooseCompany(e.target.value)}
                  disabled={companies === null}
                  className={inputClass}
                >
                  <option value="">{companies === null ? 'Loading companies…' : 'Select a company'}</option>
                  {companies?.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}{c.status !== 'active' ? ` (${c.status})` : ''}</option>
                  ))}
                </select>
                {companies?.length === 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    No partner companies yet — <Link href="/companies" className="text-primary hover:underline">add one on the Companies page</Link>.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="v-pan" className="block text-xs font-600 text-muted-foreground mb-1.5">Their PAN</label>
                <input
                  id="v-pan"
                  inputMode="numeric"
                  maxLength={9}
                  value={payee.pan}
                  onChange={(e) => setPayee((p) => ({ ...p, pan: e.target.value.replace(/\D/g, '') }))}
                  placeholder="9 digits"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="v-phone" className="block text-xs font-600 text-muted-foreground mb-1.5">Phone</label>
                <input id="v-phone" value={payee.phone} onChange={(e) => setPayee((p) => ({ ...p, phone: e.target.value }))} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="v-address" className="block text-xs font-600 text-muted-foreground mb-1.5">Address</label>
                <input id="v-address" value={payee.address} onChange={(e) => setPayee((p) => ({ ...p, address: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label htmlFor="v-their-bill" className="block text-xs font-600 text-muted-foreground mb-1.5">Their bill / invoice no.</label>
                <input id="v-their-bill" value={supplierBillNo} onChange={(e) => setSupplierBillNo(e.target.value)} placeholder="From the courier's bill" className={inputClass} />
              </div>
              <div>
                <label htmlFor="v-against" className="block text-xs font-600 text-muted-foreground mb-1.5">For our customer bill</label>
                <BillPicker id="v-against" value={againstBill} onChange={chooseBill} />
                {againstBill && (
                  <button
                    type="button"
                    onClick={() => copyFromBill(againstBill)}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-600 text-primary hover:underline"
                  >
                    <Copy size={12} /> Copy its {againstBill.items.length} consignment{againstBill.items.length === 1 ? '' : 's'} into the items
                  </button>
                )}
                {copyNote && <p className="text-[11px] text-muted-foreground mt-1">{copyNote}</p>}
              </div>
            </div>
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-700 text-foreground">Payment</h2>
            <div>
              <label htmlFor="v-date" className="block text-xs font-600 text-muted-foreground mb-1.5">Payment date *</label>
              <input id="v-date" type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} className={inputClass} />
              {voucherDate && <p className="text-[11px] text-muted-foreground mt-1">B.S. {formatBsDate(`${voucherDate}T00:00:00.000Z`)} · FY {fiscalYear(`${voucherDate}T00:00:00.000Z`)}</p>}
            </div>
            <div>
              <p className="block text-xs font-600 text-muted-foreground mb-1.5">Paid by</p>
              <div role="radiogroup" aria-label="Payment mode" className="grid grid-cols-2 gap-2">
                {Object.entries(PAYMENT_MODE_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={paymentMode === value}
                    onClick={() => setPaymentMode(value as PaymentMode)}
                    className={`px-3 py-2 text-xs font-600 rounded-lg border transition-colors ${
                      paymentMode === value ? 'bg-primary text-white border-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="v-ref" className="block text-xs font-600 text-muted-foreground mb-1.5">Cheque / transaction ref.</label>
              <input id="v-ref" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="e.g. Cheque 004512" className={inputClass} />
            </div>
          </section>
        </div>

        {/* Items */}
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-700 text-foreground">Consignments delivered by the partner</h2>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, emptyItem()])}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-600 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Plus size={14} /> Add item
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[980px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-600 text-muted-foreground w-10">#</th>
                  <th className="text-left px-2 py-2.5 text-xs font-600 text-muted-foreground w-32">Consignment / AWB No.</th>
                  <th className="text-left px-2 py-2.5 text-xs font-600 text-muted-foreground">Description of service *</th>
                  <th className="text-left px-2 py-2.5 text-xs font-600 text-muted-foreground w-28">From</th>
                  <th className="text-left px-2 py-2.5 text-xs font-600 text-muted-foreground w-28">To</th>
                  <th className="text-left px-2 py-2.5 text-xs font-600 text-muted-foreground w-20">Qty/Kg *</th>
                  <th className="text-left px-2 py-2.5 text-xs font-600 text-muted-foreground w-28">Rate (Rs.) *</th>
                  <th className="text-right px-4 py-2.5 text-xs font-600 text-muted-foreground w-32">Amount (Rs.)</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, i) => (
                  <tr key={item.key}>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-2">
                      <input value={item.awb} onChange={(e) => updateItem(item.key, 'awb', e.target.value)} placeholder="SY-10234" aria-label={`Item ${i + 1} consignment number`} className={inputClass} />
                    </td>
                    <td className="px-2 py-2">
                      <input value={item.description} onChange={(e) => updateItem(item.key, 'description', e.target.value)} placeholder="e.g. Delivery charge" aria-label={`Item ${i + 1} description`} className={inputClass} />
                    </td>
                    <td className="px-2 py-2">
                      <input value={item.from} onChange={(e) => updateItem(item.key, 'from', e.target.value)} placeholder="Kathmandu" aria-label={`Item ${i + 1} from`} className={inputClass} />
                    </td>
                    <td className="px-2 py-2">
                      <input value={item.to} onChange={(e) => updateItem(item.key, 'to', e.target.value)} placeholder="Pokhara" aria-label={`Item ${i + 1} to`} className={inputClass} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" min="0" step="any" value={item.quantity} onChange={(e) => updateItem(item.key, 'quantity', e.target.value)} aria-label={`Item ${i + 1} quantity or weight`} className={inputClass} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => updateItem(item.key, 'rate', e.target.value)} placeholder="0.00" aria-label={`Item ${i + 1} rate`} className={inputClass} />
                    </td>
                    <td className="px-4 py-2 text-right font-600 text-foreground tabular-nums">{formatNpr(lineAmount(item))}</td>
                    <td className="pr-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        disabled={items.length === 1}
                        aria-label={`Remove item ${i + 1}`}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Remarks + totals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <label htmlFor="v-remarks" className="block text-xs font-600 text-muted-foreground mb-1.5">Remarks</label>
            <textarea id="v-remarks" rows={4} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional note printed on the voucher" className={`${inputClass} resize-none`} />
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Service charges</span>
              <span className="font-600 text-foreground tabular-nums">{formatNpr(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <label htmlFor="v-other" className="text-muted-foreground whitespace-nowrap">Other charges</label>
              <input id="v-other" type="number" min="0" step="0.01" value={otherCharges} onChange={(e) => setOtherCharges(e.target.value)} placeholder="0.00" className={`${inputClass} w-28! text-right`} />
            </div>
            <div className="flex items-center justify-between text-sm border-t border-border pt-3">
              <span className="text-muted-foreground">Total</span>
              <span className="font-600 text-foreground tabular-nums">{formatNpr(gross)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <label htmlFor="v-discount" className="text-muted-foreground whitespace-nowrap">Less: discount</label>
              <input id="v-discount" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" className={`${inputClass} w-28! text-right`} />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-700 text-foreground">Net paid</span>
              <span className="text-lg font-700 text-foreground tabular-nums">Rs. {formatNpr(total)}</span>
            </div>
            <p className="text-xs text-muted-foreground italic">{amountInWords(total)}</p>
          </section>
        </div>

        <div className="flex items-center justify-end gap-3 pb-6">
          <Link href="/vouchers" className="px-4 py-2 text-sm font-600 text-muted-foreground hover:text-foreground transition-colors">Cancel</Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-600 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save voucher'}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
