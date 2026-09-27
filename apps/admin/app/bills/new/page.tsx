'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { createBill, ApiError } from '@/lib/api';
import type { PaymentMode } from '@/lib/types';
import { amountInWords, fiscalYear, formatBsDate, formatNpr, PAYMENT_MODE_LABELS } from '@/lib/billing';

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

export default function NewBillPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState({ name: '', pan: '', address: '', phone: '' });
  const [billDate, setBillDate] = useState(todayLocal);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [items, setItems] = useState<ItemRow[]>(() => [emptyItem()]);
  const [codCharge, setCodCharge] = useState('');
  const [otherCharges, setOtherCharges] = useState('');
  const [discount, setDiscount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lineAmount = (item: ItemRow) => round2((Number(item.quantity) || 0) * (Number(item.rate) || 0));
  const subtotal = round2(items.reduce((sum, item) => sum + lineAmount(item), 0));
  const codNum = round2(Number(codCharge) || 0);
  const otherNum = round2(Number(otherCharges) || 0);
  const gross = round2(subtotal + codNum + otherNum);
  const discountNum = round2(Number(discount) || 0);
  const total = round2(Math.max(0, gross - discountNum));

  function updateItem(key: number, field: keyof Omit<ItemRow, 'key'>, value: string) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
    if (error) setError(null);
  }

  function removeItem(key: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.key !== key) : prev));
  }

  function validate(): string | null {
    if (!customer.name.trim()) return 'Customer name is required.';
    if (customer.pan.trim() && !/^\d{9}$/.test(customer.pan.trim())) return 'Customer PAN must be exactly 9 digits.';
    if (!billDate) return 'Bill date is required.';
    for (const [i, item] of items.entries()) {
      if (!item.description.trim()) return `Item ${i + 1}: enter a description.`;
      if (!(Number(item.quantity) > 0)) return `Item ${i + 1}: quantity must be greater than 0.`;
      if (item.rate === '' || !(Number(item.rate) >= 0)) return `Item ${i + 1}: enter a valid rate.`;
    }
    if (codNum < 0 || otherNum < 0) return 'Charges cannot be negative.';
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
      const { data } = await createBill({
        billDate,
        customer: {
          name: customer.name.trim(),
          pan: customer.pan.trim() || undefined,
          address: customer.address.trim() || undefined,
          phone: customer.phone.trim() || undefined,
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
        codCharge: codNum,
        otherCharges: otherNum,
        discount: discountNum,
        paymentMode,
        remarks: remarks.trim() || undefined,
      });
      router.push(`/bills/${data._id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create the bill. Please try again.');
      setSaving(false);
    }
  }

  return (
    <AppLayout activePath="/bills">
      <form onSubmit={handleSubmit} noValidate className="max-w-screen-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/bills" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft size={13} /> Back to bills
            </Link>
            <h1 className="text-2xl font-700 text-foreground">New PAN Bill</h1>
            <p className="text-sm text-muted-foreground mt-0.5">The bill number is assigned automatically when you save.</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer + bill details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-700 text-foreground">Customer</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="c-name" className="block text-xs font-600 text-muted-foreground mb-1.5">Name *</label>
                <input id="c-name" value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} placeholder="Customer or company name" className={inputClass} />
              </div>
              <div>
                <label htmlFor="c-pan" className="block text-xs font-600 text-muted-foreground mb-1.5">Customer PAN</label>
                <input
                  id="c-pan"
                  inputMode="numeric"
                  maxLength={9}
                  value={customer.pan}
                  onChange={(e) => setCustomer((c) => ({ ...c, pan: e.target.value.replace(/\D/g, '') }))}
                  placeholder="9 digits (optional)"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="c-phone" className="block text-xs font-600 text-muted-foreground mb-1.5">Phone</label>
                <input id="c-phone" value={customer.phone} onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))} placeholder="98XXXXXXXX" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-address" className="block text-xs font-600 text-muted-foreground mb-1.5">Address</label>
                <input id="c-address" value={customer.address} onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))} placeholder="e.g. New Baneshwor, Kathmandu" className={inputClass} />
              </div>
            </div>
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-700 text-foreground">Bill details</h2>
            <div>
              <label htmlFor="b-date" className="block text-xs font-600 text-muted-foreground mb-1.5">Bill date *</label>
              <input id="b-date" type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className={inputClass} />
              {billDate && <p className="text-[11px] text-muted-foreground mt-1">B.S. {formatBsDate(`${billDate}T00:00:00.000Z`)} · FY {fiscalYear(`${billDate}T00:00:00.000Z`)}</p>}
            </div>
            <div>
              <p className="block text-xs font-600 text-muted-foreground mb-1.5">Payment mode</p>
<div id="b-payment" role="radiogroup" aria-label="Payment mode" className="grid grid-cols-2 gap-2">
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
          </section>
        </div>

        {/* Items */}
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-700 text-foreground">Items</h2>
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
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(item.key, 'description', e.target.value)}
                        placeholder="e.g. Document courier"
                        aria-label={`Item ${i + 1} description`}
                        className={inputClass}
                      />
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
            <label htmlFor="b-remarks" className="block text-xs font-600 text-muted-foreground mb-1.5">Remarks</label>
            <textarea id="b-remarks" rows={4} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional note printed on the bill" className={`${inputClass} resize-none`} />
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery charges</span>
              <span className="font-600 text-foreground tabular-nums">{formatNpr(subtotal)}</span>
            </div>
            {([
              ['b-cod', 'COD handling charge', codCharge, setCodCharge],
              ['b-other', 'Other charges', otherCharges, setOtherCharges],
            ] as const).map(([id, label, value, set]) => (
              <div key={id} className="flex items-center justify-between gap-4 text-sm">
                <label htmlFor={id} className="text-muted-foreground whitespace-nowrap">{label}</label>
                <input id={id} type="number" min="0" step="0.01" value={value} onChange={(e) => set(e.target.value)} placeholder="0.00" className={`${inputClass} w-28! text-right`} />
              </div>
            ))}
            <div className="flex items-center justify-between text-sm border-t border-border pt-3">
              <span className="text-muted-foreground">Total</span>
              <span className="font-600 text-foreground tabular-nums">{formatNpr(gross)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <label htmlFor="b-discount" className="text-muted-foreground whitespace-nowrap">Less: discount</label>
              <input id="b-discount" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" className={`${inputClass} w-28! text-right`} />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-700 text-foreground">Net amount</span>
              <span className="text-lg font-700 text-foreground tabular-nums">Rs. {formatNpr(total)}</span>
            </div>
            <p className="text-xs text-muted-foreground italic">{amountInWords(total)}</p>
          </section>
        </div>

        <div className="flex items-center justify-end gap-3 pb-6">
          <Link href="/bills" className="px-4 py-2 text-sm font-600 text-muted-foreground hover:text-foreground transition-colors">Cancel</Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-600 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save & issue bill'}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
