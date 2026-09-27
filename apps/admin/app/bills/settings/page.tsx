'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import BillDocument from '@/components/bills/BillDocument';
import { ArrowLeft, Loader2, AlertCircle, Upload, Trash2, Save, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  getBillSettings, updateBillSettings, uploadBillSettingsImage, removeBillSettingsImage, getMe, ApiError,
  type BillSettingsText,
} from '@/lib/api';
import type { ApiBill, BillSettings, BillSettingsImage } from '@/lib/types';
import { loadDefaultLogo, stampSrc } from '@/lib/billStamp';

const MAX_IMAGE_BYTES = 1024 * 1024;

const TEXT_FIELDS: { key: keyof BillSettingsText; label: string; placeholder?: string; wide?: boolean }[] = [
  { key: 'businessName', label: 'Business name *', placeholder: 'Swift Yak Private Limited' },
  { key: 'shortName', label: 'Short name (stamp & signature)', placeholder: 'Swift Yak Pvt. Ltd.' },
  { key: 'address', label: 'Address', placeholder: 'Street / Tole, Kathmandu-Ward, Nepal', wide: true },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'website', label: 'Website' },
  { key: 'pan', label: 'Our PAN No.', placeholder: '9 digits' },
  { key: 'signatoryName', label: 'Signatory name', placeholder: 'Your name' },
  { key: 'signatoryTitle', label: 'Signatory title', placeholder: 'Authorised Signatory' },
  { key: 'footerNote', label: 'Footer note (bottom right)', placeholder: 'Thank you for shipping with Swift Yak', wide: true },
  { key: 'printerNote', label: 'Small print (bottom left)', placeholder: 'e.g. Printed by: press name, address, PAN · Bill book serial', wide: true },
];

const IMAGES: { kind: BillSettingsImage; label: string; hint: string }[] = [
  { kind: 'signature', label: 'Signature', hint: 'Sign on white paper and take a photo, or use a transparent PNG. White backgrounds blend into the bill automatically.' },
  { kind: 'stamp', label: 'Company stamp', hint: 'Optional. Without one, a round seal is generated with your logo and short name.' },
  { kind: 'logo', label: 'Logo', hint: 'Optional. The SwiftYak logo is used by default; upload a PNG with a transparent background to replace it.' },
];

const SAMPLE_BILL: ApiBill = {
  _id: 'preview',
  billNumber: 1,
  billDate: new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z',
  customer: { name: 'Sample Customer Pvt. Ltd.', pan: '', address: 'New Baneshwor, Kathmandu', phone: '9800000000' },
  items: [
    { awb: 'SY-10234', from: 'Kathmandu', to: 'Pokhara', description: 'Parcel delivery', quantity: 3, unit: 'kg', rate: 150, amount: 450 },
    { awb: 'SY-10235', from: 'Kathmandu', to: 'Biratnagar', description: 'Document courier', quantity: 1, unit: '', rate: 200, amount: 200 },
  ],
  subtotal: 650,
  codCharge: 50,
  otherCharges: 0,
  discount: 0,
  total: 700,
  paymentMode: 'cash',
  remarks: '',
  status: 'issued',
  cancelReason: '',
  cancelledAt: null,
  createdAt: new Date().toISOString(),
};

const PREVIEW_SCALE = 0.6;

export default function BillSettingsPage() {
  const [saved, setSaved] = useState<BillSettings | null>(null);
  const [form, setForm] = useState<BillSettingsText | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState<BillSettingsImage | null>(null);
  const fileInputs = useRef<Partial<Record<BillSettingsImage, HTMLInputElement | null>>>({});
  const [defaultLogo, setDefaultLogo] = useState('');

  useEffect(() => {
    let cancelled = false;
    getBillSettings()
      .then(({ data }) => {
        if (cancelled) return;
        setSaved(data);
        setForm(pickText(data));
      })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load bill settings.'); });
    getMe()
      .then((res) => { if (!cancelled) setIsAdmin(res.user.role === 'admin'); })
      .catch(() => { if (!cancelled) setIsAdmin(false); });
    loadDefaultLogo()
      .then((src) => { if (!cancelled) setDefaultLogo(src); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const dirty = !!saved && !!form && TEXT_FIELDS.some(({ key }) => form[key] !== saved[key]);
  const preview: BillSettings | null = saved && form ? { ...saved, ...form, logo: saved.logo || defaultLogo } : null;

  async function handleSave() {
    if (!form) return;
    if (!form.businessName.trim()) {
      toast.error('Business name is required.');
      return;
    }
    if (form.pan.trim() && !/^\d{9}$/.test(form.pan.trim())) {
      toast.error('PAN No. must be 9 digits.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateBillSettings(form);
      setSaved(data);
      setForm(pickText(data));
      toast.success('Bill format saved');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(kind: BillSettingsImage, file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (PNG or JPG).');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be 1 MB or smaller.');
      return;
    }
    setImageBusy(kind);
    try {
      const { data } = await uploadBillSettingsImage(kind, file);
      setSaved(data);
      toast.success('Image updated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed.');
    } finally {
      setImageBusy(null);
      const input = fileInputs.current[kind];
      if (input) input.value = '';
    }
  }

  async function handleRemove(kind: BillSettingsImage) {
    setImageBusy(kind);
    try {
      const { data } = await removeBillSettingsImage(kind);
      setSaved(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to remove image.');
    } finally {
      setImageBusy(null);
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60';
  const readOnly = isAdmin === false;

  return (
    <AppLayout activePath="/bills">
      <div className="max-w-screen-xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Link href="/bills" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft size={13} /> Back to bills
            </Link>
            <h1 className="text-2xl font-700 text-foreground">Bill format</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Letterhead, stamp and signature printed on every bill</p>
          </div>
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-600 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 self-start sm:self-auto"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          )}
        </div>

        {readOnly && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <Lock size={14} className="shrink-0" /> Only admins can change the bill format.
          </div>
        )}

        {error ? (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        ) : !form || !saved || !preview ? (
          <div className="h-[600px] bg-card border border-border rounded-xl animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-6 items-start">
            <div className="space-y-6 min-w-0">
              {/* Images */}
              <section className="bg-card border border-border rounded-xl p-5 space-y-5">
                <h2 className="text-sm font-700 text-foreground">Signature & stamp</h2>
                {IMAGES.map(({ kind, label, hint }) => {
                  const src = kind === 'stamp' ? stampSrc(preview) : preview[kind];
                  const hasUpload = !!saved[kind];
                  return (
                    <div key={kind} className="flex items-start gap-4">
                      <div className="h-20 w-28 shrink-0 rounded-lg border border-dashed border-border bg-white flex items-center justify-center overflow-hidden">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt={label} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                        ) : (
                          <span className="text-[11px] text-neutral-400">None</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-600 text-foreground">
                          {label}
                          {!hasUpload && kind !== 'signature' && (
                            <span className="ml-2 text-[11px] font-500 text-muted-foreground">{kind === 'stamp' ? '(generated)' : '(default)'}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                        {!readOnly && (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              ref={(el) => { fileInputs.current[kind] = el; }}
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={(e) => handleUpload(kind, e.target.files?.[0])}
                            />
                            <button
                              type="button"
                              disabled={imageBusy !== null}
                              onClick={() => fileInputs.current[kind]?.click()}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-600 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                            >
                              {imageBusy === kind ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                              {hasUpload ? 'Replace' : 'Upload'}
                            </button>
                            {hasUpload && (
                              <button
                                type="button"
                                disabled={imageBusy !== null}
                                onClick={() => handleRemove(kind)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-600 text-destructive rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
                              >
                                <Trash2 size={13} /> Remove
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* Letterhead text */}
              <section className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-700 text-foreground mb-4">Letterhead</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TEXT_FIELDS.map(({ key, label, placeholder, wide }) => (
                    <div key={key} className={wide ? 'sm:col-span-2' : undefined}>
                      <label htmlFor={`s-${key}`} className="block text-xs font-600 text-muted-foreground mb-1.5">{label}</label>
                      <input
                        id={`s-${key}`}
                        value={form[key]}
                        disabled={readOnly}
                        placeholder={placeholder}
                        inputMode={key === 'pan' ? 'numeric' : undefined}
                        maxLength={key === 'pan' ? 9 : undefined}
                        onChange={(e) => {
                          const value = key === 'pan' ? e.target.value.replace(/\D/g, '') : e.target.value;
                          setForm((f) => (f ? { ...f, [key]: value } : f));
                        }}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-4">
                  Name, address, phone, email and PAN are saved onto each bill when it&apos;s issued, so changing them here won&apos;t alter bills already issued.
                </p>
              </section>
            </div>

            {/* Live preview */}
            <section className="xl:sticky xl:top-6">
              <p className="text-xs font-600 text-muted-foreground mb-2">Preview</p>
              <div
                className="overflow-hidden rounded-lg border border-border shadow-card bg-white"
                style={{ width: 794 * PREVIEW_SCALE, height: 1123 * PREVIEW_SCALE }}
              >
                <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
                  <BillDocument bill={SAMPLE_BILL} settings={preview} />
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function pickText(s: BillSettings): BillSettingsText {
  return Object.fromEntries(TEXT_FIELDS.map(({ key }) => [key, s[key] ?? ''])) as unknown as BillSettingsText;
}
