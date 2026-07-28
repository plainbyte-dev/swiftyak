'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

// ── Types ────────────────────────────────────────────────────────────────
// SwiftYak doesn't run its own fleet — every shipment is fulfilled by a
// partner logistics company. `trackingNumber` is SwiftYak's own reference
// (what the consumer sees/enters); `partnerTrackingNumber` is the partner's
// native AWB/tracking ID. Statuses are normalized into SwiftYak's own set
// regardless of what vocabulary the partner uses internally.

type NormalizedStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'customs_hold'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed';

interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
  completed: boolean;
  active?: boolean;
}

interface ShipmentData {
  trackingNumber: string; // SwiftYak reference — what the consumer entered
  partnerName: string; // e.g. "Emirates SkyCargo" — fulfilling partner
  partnerTrackingNumber: string; // partner's own AWB/tracking ID
  origin: string;
  destination: string;
  currentLocation: string;
  estimatedDelivery: string;
  status: NormalizedStatus;
  statusLabel: string; // display label for the normalized status
  service: string;
  weight: string;
  pieces: number;
  // Some partners only expose a single current status, not a full history.
  // When that's the case `events` will have 0-1 entries and the UI falls
  // back to a simplified status card instead of the full timeline.
  events: TrackingEvent[];
}

const STATUS_LABELS: Record<NormalizedStatus, string> = {
  pending: 'Pending Pickup',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  customs_hold: 'Customs Hold',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed: 'Delivery Failed',
};

const STATUS_COLORS: Record<NormalizedStatus, string> = {
  pending: 'text-[#B8860B] bg-[#FFF8E1] border-[#F5E1A0]',
  picked_up: 'text-[#1D4ED8] bg-[#EFF6FF] border-[#BFDBFE]',
  in_transit: 'text-[#1D4ED8] bg-[#EFF6FF] border-[#BFDBFE]',
  customs_hold: 'text-[#C2410C] bg-[#FFF7ED] border-[#FED7AA]',
  out_for_delivery: 'text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]',
  delivered: 'text-[#15803D] bg-[#F0FDF4] border-[#BBF7D0]',
  failed: 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]',
};

// Demo partners — in production this list (and the auto-detect logic) would
// come from your partner-carrier registry / tracking-number format rules.
const PARTNERS = [
  { id: 'auto', label: 'Auto-detect' },
  { id: 'emirates-skycargo', label: 'Emirates SkyCargo' },
  { id: 'dhl-express', label: 'DHL Express' },
  { id: 'fedex', label: 'FedEx' },
  { id: 'local-partner', label: 'Local Partner Courier' },
];

const MOCK_SHIPMENT: ShipmentData = {
  trackingNumber: 'SY250700145',
  partnerName: 'Emirates SkyCargo',
  partnerTrackingNumber: 'EK-8827194433',
  origin: 'Kathmandu, Nepal',
  destination: 'Dubai, UAE',
  currentLocation: 'Dubai International Airport, UAE',
  estimatedDelivery: 'Jul 30, 2026',
  status: 'in_transit',
  statusLabel: STATUS_LABELS.in_transit,
  service: 'International Air Freight',
  weight: '4.5 kg',
  pieces: 2,
  events: [
    {
      date: 'Jul 28, 2026',
      time: '14:32',
      location: 'Dubai International Airport, UAE',
      status: 'Arrived at Destination Hub',
      description: 'Shipment has arrived at Dubai International Airport and is pending customs clearance.',
      completed: true,
      active: true,
    },
    {
      date: 'Jul 27, 2026',
      time: '23:15',
      location: 'In-flight — KTM to DXB',
      status: 'Departed Origin',
      description: 'Shipment departed Tribhuvan International Airport on Emirates flight EK 609.',
      completed: true,
    },
    {
      date: 'Jul 27, 2026',
      time: '18:40',
      location: 'Kathmandu, Nepal',
      status: 'Cleared Export Customs',
      description: 'Shipment cleared Nepal customs. All export documentation verified and approved.',
      completed: true,
    },
    {
      date: 'Jul 27, 2026',
      time: '11:05',
      location: 'SwiftYak Hub, Balaju',
      status: 'Handed Off to Partner Carrier',
      description: 'Shipment weighed, labeled, and handed to Emirates SkyCargo for international transit.',
      completed: true,
    },
    {
      date: 'Jul 27, 2026',
      time: '09:22',
      location: 'Kathmandu, Nepal',
      status: 'Picked Up',
      description: 'Shipment collected from sender by SwiftYak courier. Tracking activated.',
      completed: true,
    },
    {
      date: 'Jul 28, 2026',
      time: 'Pending',
      location: 'Dubai, UAE',
      status: 'Customs Clearance',
      description: 'Awaiting UAE customs clearance. Estimated 4-6 hours processing time.',
      completed: false,
    },
    {
      date: 'Jul 29, 2026',
      time: 'Estimated',
      location: 'Dubai, UAE',
      status: 'Out for Delivery',
      description: 'Shipment will be dispatched to recipient address.',
      completed: false,
    },
    {
      date: 'Jul 30, 2026',
      time: 'Estimated',
      location: 'Dubai, UAE',
      status: 'Delivered',
      description: 'Expected delivery to recipient.',
      completed: false,
    },
  ],
};

// Demo shipment for a partner that only exposes a single current status,
// no event history — this is what the graceful-degradation view renders.
const MOCK_SHIPMENT_SPARSE: ShipmentData = {
  trackingNumber: 'SY250800229',
  partnerName: 'Local Partner Courier',
  partnerTrackingNumber: 'LPC-004471',
  origin: 'Pokhara, Nepal',
  destination: 'Kathmandu, Nepal',
  currentLocation: 'Kathmandu Sorting Facility',
  estimatedDelivery: 'Jul 29, 2026',
  status: 'in_transit',
  statusLabel: STATUS_LABELS.in_transit,
  service: 'Domestic Standard',
  weight: '1.2 kg',
  pieces: 1,
  events: [],
};

export default function TrackingInterface() {
  const [trackingInput, setTrackingInput] = useState('SY250700145');
  const [partnerId, setPartnerId] = useState('auto');
  const [needsFallback, setNeedsFallback] = useState(false);
  const [fallbackContact, setFallbackContact] = useState('');
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const value = trackingInput.trim().toUpperCase();

    if (!value) {
      setError('Please enter a tracking number.');
      return;
    }

    setLoading(true);
    // Simulate API call — backend integration point.
    // In production: look up by SwiftYak trackingNumber first; if the
    // partner can't be determined from the number's format, prompt for
    // partnerId, and if the partner requires a secondary identifier
    // (phone/postal code) for privacy, prompt for that too before the
    // lookup is retried against the partner's API.
    setTimeout(() => {
      if (value === 'SY250700145') {
        setShipment(MOCK_SHIPMENT);
        setNeedsFallback(false);
      } else if (value === 'SY250800229') {
        setShipment(MOCK_SHIPMENT_SPARSE);
        setNeedsFallback(false);
      } else if (value === 'SY250900001' && !fallbackContact) {
        // Simulates a partner requiring a secondary identifier
        setError('This carrier requires extra verification to show tracking details.');
        setNeedsFallback(true);
        setShipment(null);
      } else {
        setError('No shipment found for this tracking number. Please verify and try again.');
        setShipment(null);
      }
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F8F9FC' }}>
      {/* Hero Bar — starts at y=0 (pt-24 lives on this div, not the outer
          wrapper) so the fixed Header's transparent/white-text state at
          the top of the page sits on this dark gradient instead of the
          light page background below it. */}
      <div
        className="pt-24 pb-16 px-4"
        style={{
          background:
            'linear-gradient(135deg, #0D1B6E 0%, #172A8A 35%, #1E3AA8 65%, #0A1550 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[#EFB000] text-xs font-bold tracking-widest uppercase mb-3 block">
            Real-Time Tracking
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Track Your Shipment
          </h1>
          <p className="text-white/60 text-base mb-10">
            Enter your SwiftYak tracking number for live status updates
          </p>

          {/* Search form */}
          <form onSubmit={handleTrack} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Icon name="MagnifyingGlassIcon" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="e.g. SY250700145"
                  className="w-full pl-11 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/35 text-sm font-medium focus:outline-none focus:border-[#EFB000] focus:bg-white/15 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-200 disabled:opacity-60 flex items-center gap-2 justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #EFB000 0%, #FFD040 50%, #D4960A 100%)',
                  color: '#172A8A',
                }}
              >
                {loading ? (
                  <>
                    <Icon name="ArrowPathIcon" size={18} className="animate-spin" />
                    Tracking...
                  </>
                ) : (
                  <>
                    <Icon name="MagnifyingGlassIcon" size={18} />
                    Track
                  </>
                )}
              </button>
            </div>

            {/* Carrier is optional — most numbers auto-detect. Only surface
                this as something to think about via the helper link below;
                keeping it collapsed by default avoids adding friction for
                the common case. */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <label htmlFor="partner-select" className="text-white/40 text-xs">
                Carrier (optional):
              </label>
              <select
                id="partner-select"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="bg-white/10 border border-white/20 text-white/80 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#EFB000]"
              >
                {PARTNERS.map((p) => (
                  <option key={p.id} value={p.id} className="text-[#0D1117]">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fallback verification — only shown when a lookup indicates
                the partner needs a secondary identifier before releasing
                tracking details (common for privacy-sensitive carriers). */}
            {needsFallback && (
              <div className="mt-4 max-w-md mx-auto text-left">
                <label htmlFor="fallback-contact" className="text-white/70 text-xs font-semibold block mb-1.5">
                  Recipient phone number or postal code
                </label>
                <input
                  id="fallback-contact"
                  type="text"
                  value={fallbackContact}
                  onChange={(e) => setFallbackContact(e.target.value)}
                  placeholder="e.g. +977 98XXXXXXXX or postal code"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/35 text-sm focus:outline-none focus:border-[#EFB000] focus:bg-white/15 transition-all"
                />
                <p className="text-white/40 text-xs mt-1.5">
                  This carrier requires an extra identifier to protect the recipient&apos;s privacy.
                </p>
              </div>
            )}
          </form>

          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-400/30 text-red-200 text-sm rounded-xl px-4 py-3 max-w-2xl mx-auto">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {shipment && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-6">
          {/* Shipment Summary Card */}
          <div
            className="rounded-3xl border p-6 sm:p-8 shadow-sm"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E6F0' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#6B7280' }}>
                  Tracking Number
                </p>
                <p className="text-2xl font-extrabold tracking-tight" style={{ color: '#172A8A' }}>
                  {shipment.trackingNumber}
                </p>
              </div>
              <span
                className={`self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${STATUS_COLORS[shipment.status]}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {shipment.statusLabel}
              </span>
            </div>

            {/* Fulfilling partner — shown transparently so the consumer
                knows who's physically handling the shipment; adjust/remove
                this if SwiftYak decides to fully white-label instead. */}
            <div className="flex items-center gap-1.5 mb-6">
              <Icon name="TruckIcon" size={12} style={{ color: '#6B7280' }} />
              <p className="text-xs" style={{ color: '#6B7280' }}>
                Handled by <span className="font-semibold" style={{ color: '#0D1117' }}>{shipment.partnerName}</span>
                {' · '}Partner ref: {shipment.partnerTrackingNumber}
              </p>
            </div>

            {/* Route */}
            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(238, 240, 247, 0.5)' }}>
              <div className="text-center flex-1">
                <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#6B7280' }}>From</p>
                <p className="font-bold text-sm" style={{ color: '#0D1117' }}>{shipment.origin}</p>
              </div>
              <div className="flex-1 flex items-center justify-center gap-2">
                <div className="flex-1 h-px" style={{ backgroundColor: '#E2E6F0' }} />
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#172A8A' }}>
                  <Icon name="TruckIcon" size={14} className="text-white" />
                </div>
                <div className="flex-1 h-px" style={{ backgroundColor: '#E2E6F0' }} />
              </div>
              <div className="text-center flex-1">
                <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#6B7280' }}>To</p>
                <p className="font-bold text-sm" style={{ color: '#0D1117' }}>{shipment.destination}</p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Current Location', value: shipment.currentLocation, icon: 'MapPinIcon' },
                { label: 'Carrier', value: shipment.partnerName, icon: 'PaperAirplaneIcon' },
                { label: 'Est. Delivery', value: shipment.estimatedDelivery, icon: 'CalendarDaysIcon' },
                { label: 'Service', value: shipment.service, icon: 'GlobeAltIcon' },
                { label: 'Weight', value: shipment.weight, icon: 'ScaleIcon' },
                { label: 'Pieces', value: String(shipment.pieces), icon: 'ArchiveBoxIcon' },
              ].map((detail) => (
                <div key={detail.label} className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(238, 240, 247, 0.4)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon name={detail.icon as never} size={12} style={{ color: '#6B7280' }} />
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>{detail.label}</p>
                  </div>
                  <p className="text-xs font-bold leading-tight" style={{ color: '#0D1117' }}>{detail.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline — full stepper when the partner gives event history,
              graceful single-status fallback when they don't. */}
          {shipment.events.length > 0 ? (
            <div
              className="rounded-3xl border p-6 sm:p-8 shadow-sm"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E6F0' }}
            >
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: '#0D1117' }}>
                <Icon name="ClockIcon" size={20} style={{ color: '#172A8A' }} />
                Shipment Timeline
              </h2>

              <div className="space-y-0">
                {shipment.events.map((event, i) => (
                  <div key={i} className="flex gap-4 sm:gap-6">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all duration-300"
                        style={
                          event.active
                            ? { backgroundColor: '#EFB000', borderColor: '#EFB000', color: '#172A8A', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }
                            : event.completed
                            ? { backgroundColor: '#172A8A', borderColor: '#172A8A', color: '#FFFFFF' }
                            : { backgroundColor: '#EEF0F7', borderColor: '#E2E6F0', color: '#6B7280' }
                        }
                      >
                        {event.completed ? <Icon name="CheckIcon" size={16} /> : <Icon name="ClockIcon" size={16} />}
                      </div>
                      {i < shipment.events.length - 1 && (
                        <div
                          className="w-0.5 flex-1 my-1 min-h-8"
                          style={{ backgroundColor: event.completed ? 'rgba(23,42,138,0.3)' : '#E2E6F0' }}
                        />
                      )}
                    </div>

                    <div className={`flex-1 pb-6 ${i === shipment.events.length - 1 ? 'pb-0' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
                        <p
                          className="font-bold text-sm"
                          style={{ color: event.active ? '#EFB000' : event.completed ? '#0D1117' : '#6B7280' }}
                        >
                          {event.status}
                        </p>
                        <p className="text-xs font-medium shrink-0" style={{ color: '#6B7280' }}>
                          {event.date} · {event.time}
                        </p>
                      </div>
                      <p className="text-xs flex items-center gap-1 mb-1" style={{ color: '#6B7280' }}>
                        <Icon name="MapPinIcon" size={11} />
                        {event.location}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="rounded-3xl border p-6 sm:p-8 shadow-sm flex items-start gap-4"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E6F0' }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(23,42,138,0.08)' }}>
                <Icon name="InformationCircleIcon" size={20} style={{ color: '#172A8A' }} />
              </div>
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: '#0D1117' }}>
                  Detailed timeline not available from this carrier
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                  {shipment.partnerName} only provides a current status rather than a full event
                  history for this shipment. It&apos;s currently marked as{' '}
                  <span className="font-semibold" style={{ color: '#0D1117' }}>{shipment.statusLabel}</span>{' '}
                  at {shipment.currentLocation}. Check back later for updates.
                </p>
              </div>
            </div>
          )}

          {/* Help banner */}
          <div className="rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ backgroundColor: '#172A8A' }}>
            <div className="text-white">
              <p className="font-bold text-lg mb-1">Need Help with This Shipment?</p>
              <p className="text-white/60 text-sm">Our support team can assist with customs, delays, or delivery issues.</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <a
                href="/#contact"
                className="font-bold px-5 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm"
                style={{ backgroundColor: '#FFFFFF', color: '#172A8A' }}
              >
                Contact Support
              </a>
              <a
                href="https://wa.me/977981234567"
                className="font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-all text-sm flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #EFB000 0%, #FFD040 50%, #D4960A 100%)',
                  color: '#172A8A',
                }}
              >
                <Icon name="ChatBubbleLeftEllipsisIcon" size={16} />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Empty state / initial state */}
      {!shipment && !loading && (
        <div className="max-w-2xl mx-auto px-4 mt-16 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#EEF0F7' }}>
            <Icon name="MagnifyingGlassIcon" size={32} style={{ color: '#6B7280' }} />
          </div>
          <h2 className="font-bold text-xl mb-3" style={{ color: '#0D1117' }}>Enter Your Tracking Number</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#6B7280' }}>
            Your SwiftYak tracking number starts with &ldquo;SY&rdquo; followed by 9 digits (e.g., SY250700145).
            You can find it on your shipment receipt or confirmation email. If we&apos;ve partnered with a carrier
            for your route, we&apos;ll automatically match it to their tracking system for you.
          </p>
          <div className="rounded-2xl p-5 border text-left" style={{ backgroundColor: 'rgba(238,240,247,0.5)', borderColor: '#E2E6F0' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#0D1117' }}>Try a demo tracking number:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTrackingInput('SY250700145')}
                className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'rgba(23,42,138,0.08)', color: '#172A8A' }}
              >
                <Icon name="DocumentTextIcon" size={14} />
                SY250700145 — Full timeline (Emirates SkyCargo)
              </button>
              <button
                onClick={() => setTrackingInput('SY250800229')}
                className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'rgba(23,42,138,0.08)', color: '#172A8A' }}
              >
                <Icon name="DocumentTextIcon" size={14} />
                SY250800229 — Status only (Local Partner)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}