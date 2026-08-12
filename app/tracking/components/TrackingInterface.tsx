'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { trackShipment, ApiError, type ShipmentStatus, type TrackedShipment } from '@/lib/api';

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: 'Pending Pickup',
  assigned: 'Courier Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Delivery Failed',
  cancelled: 'Cancelled',
};

const STATUS_DESCRIPTIONS: Record<ShipmentStatus, string> = {
  pending: 'Booking received and waiting to be assigned to a courier.',
  assigned: 'A SwiftYak courier has been assigned and will pick up the shipment soon.',
  picked_up: 'Shipment collected from sender by SwiftYak courier.',
  in_transit: 'Shipment is on its way to the destination.',
  delivered: 'Shipment has been delivered to the recipient.',
  failed: 'Delivery attempt failed. Our team will follow up.',
  cancelled: 'This shipment was cancelled.',
};

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  pending: 'text-[#B8860B] bg-[#FFF8E1] border-[#F5E1A0]',
  assigned: 'text-[#1D4ED8] bg-[#EFF6FF] border-[#BFDBFE]',
  picked_up: 'text-[#1D4ED8] bg-[#EFF6FF] border-[#BFDBFE]',
  in_transit: 'text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]',
  delivered: 'text-[#15803D] bg-[#F0FDF4] border-[#BBF7D0]',
  failed: 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]',
  cancelled: 'text-[#6B7280] bg-[#F3F4F6] border-[#E5E7EB]',
};

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function TrackingInterface() {
  const [trackingInput, setTrackingInput] = useState('');
  const [shipment, setShipment] = useState<TrackedShipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const value = trackingInput.trim().toUpperCase();

    if (!value) {
      setError('Please enter a tracking number.');
      return;
    }

    setLoading(true);
    try {
      const res = await trackShipment(value);
      setShipment(res.data);
    } catch (err) {
      setShipment(null);
      if (err instanceof ApiError && err.status === 404) {
        setError('No shipment found for this tracking number. Please verify and try again.');
      } else {
        setError('Something went wrong looking up this shipment. Please try again shortly.');
      }
    } finally {
      setLoading(false);
    }
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
                  placeholder="e.g. CDK-12345"
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
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
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
                {STATUS_LABELS[shipment.status]}
              </span>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Courier', value: shipment.courier?.name || 'Not yet assigned', icon: 'UserIcon' },
                { label: 'Vehicle', value: shipment.courier?.vehicle || '—', icon: 'TruckIcon' },
                { label: 'Est. Delivery', value: formatDate(shipment.eta), icon: 'CalendarDaysIcon' },
                { label: 'Weight', value: `${shipment.weightKg} kg`, icon: 'ScaleIcon' },
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

          {/* Timeline — built from the shipment's actual status history */}
          <div
            className="rounded-3xl border p-6 sm:p-8 shadow-sm"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E6F0' }}
          >
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: '#0D1117' }}>
              <Icon name="ClockIcon" size={20} style={{ color: '#172A8A' }} />
              Shipment Timeline
            </h2>

            <div className="space-y-0">
              {shipment.statusHistory.map((event, i) => {
                const { date, time } = formatDateTime(event.changedAt);
                const isLast = i === shipment.statusHistory.length - 1;
                return (
                  <div key={i} className="flex gap-4 sm:gap-6">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all duration-300"
                        style={
                          isLast
                            ? { backgroundColor: '#EFB000', borderColor: '#EFB000', color: '#172A8A', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }
                            : { backgroundColor: '#172A8A', borderColor: '#172A8A', color: '#FFFFFF' }
                        }
                      >
                        <Icon name={isLast ? 'ClockIcon' : 'CheckIcon'} size={16} />
                      </div>
                      {!isLast && (
                        <div
                          className="w-0.5 flex-1 my-1 min-h-8"
                          style={{ backgroundColor: 'rgba(23,42,138,0.3)' }}
                        />
                      )}
                    </div>

                    <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
                        <p
                          className="font-bold text-sm"
                          style={{ color: isLast ? '#EFB000' : '#0D1117' }}
                        >
                          {STATUS_LABELS[event.status]}
                        </p>
                        <p className="text-xs font-medium shrink-0" style={{ color: '#6B7280' }}>
                          {date} · {time}
                        </p>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                        {STATUS_DESCRIPTIONS[event.status]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Help banner */}
          <div className="rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ backgroundColor: '#172A8A' }}>
            <div className="text-white">
              <p className="font-bold text-lg mb-1">Need Help with This Shipment?</p>
              <p className="text-white/60 text-sm">Our support team can assist with delays or delivery issues.</p>
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
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            Your SwiftYak tracking number starts with &ldquo;CDK-&rdquo; followed by 5 digits (e.g., CDK-12345).
            You can find it on your booking confirmation.
          </p>
        </div>
      )}
    </div>
  );
}
