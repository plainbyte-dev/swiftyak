'use client';

import React, { useState } from 'react';
import { X, Package, MapPin, FileText, Loader2, AlertCircle, Globe2 } from 'lucide-react';
import { createShipment, ApiError } from '@/lib/api';
import type { ApiShipment } from '@/lib/types';
import ShipmentLabel, { ShipmentLabelData } from './ShipmentLabel';

interface NewShipmentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (shipment: ApiShipment) => void;
}

const RATE_CARDS = [
  'TEKG - Base and Kilo',
  'TE250 - 250 Gram Parcel',
  'TE0 - 500 Gram Parcel',
  'TE1 - 1Kg Parcel',
  'TE3 - 3Kg Parcel',
  'TE5 - 5Kg Parcel',
  'L11 - A Card Rate Block & BK',
  'TSKG - Base and Kilo',
  'TS250 - 250 Gram Parcel',
  'TS0 - 500g Parcel',
  'TS1 - 1Kg Parcel',
  'TS3 - 3Kg Parcel',
  'TS5 - 5Kg Parcel',
];
const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
const CONTENT_TYPES = ['Non-Doc', 'Documents', 'Sample', 'Gift'];

interface FormState {
  hblReference: string;
  rateCard: string;
  length: string;
  width: string;
  height: string;
  weight: string;
  quantity: string;
  declaredValue: string;
  contentType: string;

  pickupFirstName: string;
  pickupLastName: string;
  pickupEmail: string;
  pickupPhone: string;
  pickupAddress1: string;
  pickupAddress2: string;
  pickupSuburb: string;
  pickupState: string;
  pickupPostcode: string;
  pickupCountry: string;

  destFirstName: string;
  destLastName: string;
  destCompany: string;
  destEmail: string;
  destPhone: string;
  destAddress1: string;
  destAddress2: string;
  destSuburb: string;
  destState: string;
  destPostcode: string;
  destCountry: string;

  specialInstructions: string;
  acceptedTerms: boolean;

  // Freight / customs manifest details — optional, usually filled in once
  // flight/consolidation details are known.
  masterBill: string;
  flightNo: string;
  airlineCode: string;
  iataLoadPort: string;
  iataDestPort: string;
  portDestination: string;
  currencyCode: string;
  descriptionOfGoods: string;
  remarks: string;
}

const EMPTY_FORM: FormState = {
  hblReference: '',
  rateCard: RATE_CARDS[0],
  length: '',
  width: '',
  height: '',
  weight: '',
  quantity: '1',
  declaredValue: '',
  contentType: CONTENT_TYPES[0],

  pickupFirstName: '',
  pickupLastName: '',
  pickupEmail: '',
  pickupPhone: '',
  pickupAddress1: '',
  pickupAddress2: '',
  pickupSuburb: '',
  pickupState: STATES[0],
  pickupPostcode: '',
  pickupCountry: 'Nepal',

  destFirstName: '',
  destLastName: '',
  destCompany: '',
  destEmail: '',
  destPhone: '',
  destAddress1: '',
  destAddress2: '',
  destSuburb: '',
  destState: STATES[0],
  destPostcode: '',
  destCountry: 'Australia',

  specialInstructions: '',
  acceptedTerms: false,

  masterBill: '',
  flightNo: '',
  airlineCode: '',
  iataLoadPort: '',
  iataDestPort: '',
  portDestination: '',
  currencyCode: 'USD',
  descriptionOfGoods: '',
  remarks: '',
};

function formatAddress(f: {
  address1: string; address2: string; suburb: string; state: string; postcode: string;
}) {
  return [f.address1, f.address2, f.suburb, f.state, f.postcode].filter(Boolean).join(', ');
}

const COUNTRY_CODES: Record<string, string> = {
  Nepal: 'NPL',
  Australia: 'AUS',
  Pakistan: 'PAK',
  India: 'IND',
  'United States': 'USA',
  'United Kingdom': 'GBR',
};
function countryCode(country: string) {
  return COUNTRY_CODES[country] ?? country.slice(0, 3).toUpperCase();
}

export default function NewShipmentModal({ open, onClose, onCreated }: NewShipmentModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labelData, setLabelData] = useState<ShipmentLabelData | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetAndClose() {
    setForm(EMPTY_FORM);
    setError(null);
    setLabelData(null);
    onClose();
  }

  function startAnotherShipment() {
    setForm(EMPTY_FORM);
    setError(null);
    setLabelData(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.destFirstName || !form.destLastName) {
      setError('Recipient first and last name are required.');
      return;
    }
    if (!formatAddress({ address1: form.pickupAddress1, address2: form.pickupAddress2, suburb: form.pickupSuburb, state: form.pickupState, postcode: form.pickupPostcode })) {
      setError('Pickup address is required.');
      return;
    }
    if (!formatAddress({ address1: form.destAddress1, address2: form.destAddress2, suburb: form.destSuburb, state: form.destState, postcode: form.destPostcode })) {
      setError('Destination address is required.');
      return;
    }
    if (!form.weight || Number(form.weight) <= 0) {
      setError('Enter a valid package weight.');
      return;
    }
    if (!form.acceptedTerms) {
      setError('You must accept the terms and conditions.');
      return;
    }

    setSubmitting(true);
    try {
      const l = Number(form.length) || 0;
      const w = Number(form.width) || 0;
      const h = Number(form.height) || 0;
      const volumetricWeightKg = l && w && h ? (l * w * h) / 5000 : Number(form.weight);

      const { data } = await createShipment({
        recipient: `${form.destFirstName} ${form.destLastName}`.trim(),
        origin: formatAddress({
          address1: form.pickupAddress1, address2: form.pickupAddress2,
          suburb: form.pickupSuburb, state: form.pickupState, postcode: form.pickupPostcode,
        }),
        destination: formatAddress({
          address1: form.destAddress1, address2: form.destAddress2,
          suburb: form.destSuburb, state: form.destState, postcode: form.destPostcode,
        }),
        weightKg: Number(form.weight),
        phone: form.destPhone || undefined,
        notes: [
          form.hblReference && `Ref: ${form.hblReference}`,
          form.rateCard && `Rate card: ${form.rateCard}`,
          form.specialInstructions,
        ].filter(Boolean).join(' — ') || undefined,
        sender: {
          name: `${form.pickupFirstName} ${form.pickupLastName}`.trim() || undefined,
          email: form.pickupEmail || undefined,
          phone: form.pickupPhone || undefined,
          address1: form.pickupAddress1 || undefined,
          address2: form.pickupAddress2 || undefined,
          city: form.pickupSuburb || undefined,
          state: form.pickupState || undefined,
          postcode: form.pickupPostcode || undefined,
          country: form.pickupCountry || undefined,
          countryCode: countryCode(form.pickupCountry),
        },
        consignee: {
          name: `${form.destFirstName} ${form.destLastName}`.trim() || undefined,
          company: form.destCompany || undefined,
          email: form.destEmail || undefined,
          phone: form.destPhone || undefined,
          address1: form.destAddress1 || undefined,
          address2: form.destAddress2 || undefined,
          city: form.destSuburb || undefined,
          state: form.destState || undefined,
          postcode: form.destPostcode || undefined,
          country: form.destCountry || undefined,
          countryCode: countryCode(form.destCountry),
        },
        freight: {
          masterBill: form.masterBill || undefined,
          flightNo: form.flightNo || undefined,
          airlineCode: form.airlineCode || undefined,
          iataLoadPort: form.iataLoadPort || undefined,
          iataDestPort: form.iataDestPort || undefined,
          portDestination: form.portDestination || undefined,
          pieces: Number(form.quantity) || 1,
          volumetricWeightKg,
          declaredValueUsd: Number(form.declaredValue) || 0,
          currencyCode: form.currencyCode || 'USD',
          contentType: form.contentType,
          descriptionOfGoods: form.descriptionOfGoods || undefined,
          remarks: form.remarks || undefined,
        },
      });

      onCreated?.(data);

      setLabelData({
        trackingNumber: data.trackingNumber,
        originCountry: countryCode(form.pickupCountry),
        destinationCountry: countryCode(form.destCountry),
        pieces: Number(form.quantity) || 1,
        actualWeightKg: Number(form.weight),
        volumetricWeightKg,
        declaredValueUsd: Number(form.declaredValue) || 0,
        contentType: form.contentType,
        description: form.specialInstructions || '—',
        sender: {
          name: `${form.pickupFirstName} ${form.pickupLastName}`.trim() || '—',
          addressLines: [
            form.pickupAddress1,
            [form.pickupSuburb, form.pickupState, form.pickupPostcode].filter(Boolean).join(', '),
          ].filter(Boolean),
          phone: form.pickupPhone,
        },
        receiver: {
          name: `${form.destFirstName} ${form.destLastName}`.trim(),
          address: form.destAddress1,
          city: [form.destSuburb, form.destState, form.destPostcode].filter(Boolean).join(', '),
          country: form.destCountry,
          phone: form.destPhone,
        },
        orderCreationDate: new Date().toLocaleDateString('en-US'),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create shipment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-shipment-title"
      onClick={resetAndClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card rounded-t-xl">
          <div>
            <h2 id="new-shipment-title" className="text-base font-700 text-foreground">
              {labelData ? 'Shipment Created' : 'New Shipment'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {labelData ? 'Your shipping label is ready' : 'Create a booking for pickup and delivery'}
            </p>
          </div>
          <button
            onClick={resetAndClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {labelData ? (
          <>
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              <ShipmentLabel data={labelData} />
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border no-print">
              <button type="button" onClick={startAnotherShipment} className="btn-secondary">
                Create Another Shipment
              </button>
              <button type="button" onClick={resetAndClose} className="btn-primary">
                Done
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
              {error && (
                <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Package Details */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-700 text-foreground">
                  <Package size={15} className="text-primary" />
                  Package Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">HBL / Reference #</label>
                    <input
                      className="form-input"
                      value={form.hblReference}
                      onChange={(e) => update('hblReference', e.target.value)}
                      placeholder="e.g. REF-10234"
                    />
                  </div>
                  <div>
                    <label className="form-label">Rate Card</label>
                    <select
                      className="form-input"
                      value={form.rateCard}
                      onChange={(e) => update('rateCard', e.target.value)}
                    >
                      {RATE_CARDS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div>
                    <label className="form-label">Length (cm)</label>
                    <input
                      type="number" min="0" step="0.1"
                      className="form-input"
                      value={form.length}
                      onChange={(e) => update('length', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Width (cm)</label>
                    <input
                      type="number" min="0" step="0.1"
                      className="form-input"
                      value={form.width}
                      onChange={(e) => update('width', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Height (cm)</label>
                    <input
                      type="number" min="0" step="0.1"
                      className="form-input"
                      value={form.height}
                      onChange={(e) => update('height', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Weight (kg)</label>
                    <input
                      type="number" min="0" step="0.1" required
                      className="form-input"
                      value={form.weight}
                      onChange={(e) => update('weight', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Quantity</label>
                    <input
                      type="number" min="1" step="1"
                      className="form-input"
                      value={form.quantity}
                      onChange={(e) => update('quantity', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Declared Value (USD)</label>
                    <input
                      type="number" min="0" step="0.01"
                      className="form-input"
                      value={form.declaredValue}
                      onChange={(e) => update('declaredValue', e.target.value)}
                      placeholder="e.g. 197.60"
                    />
                  </div>
                  <div>
                    <label className="form-label">Content Type</label>
                    <select
                      className="form-input"
                      value={form.contentType}
                      onChange={(e) => update('contentType', e.target.value)}
                    >
                      {CONTENT_TYPES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* Freight & Customs Details */}
              <section className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-700 text-foreground">
                  <Globe2 size={15} className="text-muted-foreground" />
                  Freight &amp; Customs Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Master Bill</label>
                    <input className="form-input" value={form.masterBill} onChange={(e) => update('masterBill', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Flight No</label>
                    <input className="form-input" value={form.flightNo} onChange={(e) => update('flightNo', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Airline Code</label>
                    <input className="form-input" value={form.airlineCode} onChange={(e) => update('airlineCode', e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <label className="form-label">IATA Load Port</label>
                    <input className="form-input" value={form.iataLoadPort} onChange={(e) => update('iataLoadPort', e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <label className="form-label">IATA Dest Port</label>
                    <input className="form-input" value={form.iataDestPort} onChange={(e) => update('iataDestPort', e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <label className="form-label">Port Destination</label>
                    <input className="form-input" value={form.portDestination} onChange={(e) => update('portDestination', e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <label className="form-label">Currency Code</label>
                    <input className="form-input" value={form.currencyCode} onChange={(e) => update('currencyCode', e.target.value.toUpperCase())} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">Description of Goods</label>
                    <input className="form-input" value={form.descriptionOfGoods} onChange={(e) => update('descriptionOfGoods', e.target.value)} placeholder="e.g. CLOTHES" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Remarks</label>
                  <input className="form-input" value={form.remarks} onChange={(e) => update('remarks', e.target.value)} />
                </div>
              </section>

              {/* Pickup / Sender Details */}
              <section className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-700 text-foreground">
                  <MapPin size={15} className="text-primary" />
                  Pickup Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name</label>
                    <input className="form-input" value={form.pickupFirstName} onChange={(e) => update('pickupFirstName', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input className="form-input" value={form.pickupLastName} onChange={(e) => update('pickupLastName', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={form.pickupEmail} onChange={(e) => update('pickupEmail', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input type="tel" className="form-input" value={form.pickupPhone} onChange={(e) => update('pickupPhone', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Address Line 1</label>
                  <input required className="form-input" value={form.pickupAddress1} onChange={(e) => update('pickupAddress1', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Address Line 2 (Optional)</label>
                  <input className="form-input" value={form.pickupAddress2} onChange={(e) => update('pickupAddress2', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="form-label">Suburb</label>
                    <input className="form-input" value={form.pickupSuburb} onChange={(e) => update('pickupSuburb', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">State</label>
                    <select className="form-input" value={form.pickupState} onChange={(e) => update('pickupState', e.target.value)}>
                      {STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Postcode</label>
                    <input className="form-input" value={form.pickupPostcode} onChange={(e) => update('pickupPostcode', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label flex items-center gap-1">
                      <Globe2 size={12} /> Country
                    </label>
                    <input className="form-input" value={form.pickupCountry} onChange={(e) => update('pickupCountry', e.target.value)} />
                  </div>
                </div>
              </section>

              {/* Destination Details */}
              <section className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-700 text-foreground">
                  <MapPin size={15} className="text-accent" />
                  Destination Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name</label>
                    <input required className="form-input" value={form.destFirstName} onChange={(e) => update('destFirstName', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input required className="form-input" value={form.destLastName} onChange={(e) => update('destLastName', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Company Name</label>
                    <input className="form-input" value={form.destCompany} onChange={(e) => update('destCompany', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={form.destEmail} onChange={(e) => update('destEmail', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input type="tel" className="form-input" value={form.destPhone} onChange={(e) => update('destPhone', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Address Line 1</label>
                  <input required className="form-input" value={form.destAddress1} onChange={(e) => update('destAddress1', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Address Line 2 (Optional)</label>
                  <input className="form-input" value={form.destAddress2} onChange={(e) => update('destAddress2', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="form-label">Suburb / City</label>
                    <input className="form-input" value={form.destSuburb} onChange={(e) => update('destSuburb', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">State</label>
                    <select className="form-input" value={form.destState} onChange={(e) => update('destState', e.target.value)}>
                      {STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Postcode</label>
                    <input className="form-input" value={form.destPostcode} onChange={(e) => update('destPostcode', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label flex items-center gap-1">
                      <Globe2 size={12} /> Country
                    </label>
                    <input className="form-input" value={form.destCountry} onChange={(e) => update('destCountry', e.target.value)} />
                  </div>
                </div>
              </section>

              {/* Special Instructions */}
              <section className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-700 text-foreground">
                  <FileText size={15} className="text-muted-foreground" />
                  Special Instructions
                </div>
                <textarea
                  className="form-input min-h-[80px] resize-y"
                  value={form.specialInstructions}
                  onChange={(e) => update('specialInstructions', e.target.value)}
                  placeholder="e.g. Leave at front desk, fragile, call on arrival…"
                />
              </section>

              <label className="flex items-center gap-2 text-xs text-foreground pt-2">
                <input
                  type="checkbox"
                  checked={form.acceptedTerms}
                  onChange={(e) => update('acceptedTerms', e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-[var(--primary)]"
                />
                I accept the terms and conditions
              </label>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button type="button" onClick={resetAndClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? 'Submitting…' : 'Submit Shipment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}