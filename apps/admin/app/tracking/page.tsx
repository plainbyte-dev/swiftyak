'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { MapPin, Package, Truck, Clock, Search, Navigation, AlertCircle } from 'lucide-react';
import { getShipments, getShipmentEvents, ApiError } from '@/lib/api';
import type { ApiShipment } from '@/lib/types';
import type { ShipmentEvent } from '@/lib/api';

const ACTIVE_STATUSES = ['assigned', 'picked_up', 'in_transit'] as const;

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  in_transit: { label: 'In Transit', className: 'text-info bg-info/10', icon: <Truck size={11} /> },
  picked_up: { label: 'Picked Up', className: 'text-warning bg-warning/10', icon: <Package size={11} /> },
  assigned: { label: 'Assigned', className: 'text-primary bg-primary/10', icon: <Clock size={11} /> },
};

const AVATAR_COLORS = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning'];

const REFRESH_INTERVAL_MS = 15000;

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatEta(eta: string | null) {
  if (!eta) return 'TBD';
  return new Date(eta).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatEventTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TrackingPage() {
  const [shipments, setShipments] = useState<ApiShipment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const fetchActive = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const results = await Promise.all(
        ACTIVE_STATUSES.map((status) => getShipments({ status, perPage: 100 }))
      );
      const combined = results.flatMap((r) => r.data);
      setShipments(combined);
      setError(null);
      setSelectedId((prev) => prev ?? combined[0]?._id ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the CourierDesk API');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
    const interval = setInterval(() => fetchActive(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchActive]);

  const filtered = shipments.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.trackingNumber.toLowerCase().includes(q) ||
      s.recipient.toLowerCase().includes(q) ||
      (s.courier?.name.toLowerCase().includes(q) ?? false)
    );
  });

  const selected = shipments.find((s) => s._id === selectedId) ?? null;

  // ── Fetch timeline events whenever the selected shipment changes ────────
  useEffect(() => {
    if (!selected) {
      setEvents([]);
      return;
    }
    let cancelled = false;
    setEventsLoading(true);
    setEventsError(null);

    getShipmentEvents(selected._id)
      .then((res) => {
        if (!cancelled) setEvents(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setEventsError(err instanceof ApiError ? err.message : 'Could not load tracking history');
          setEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected?._id]);

  return (
    <AppLayout activePath="/tracking">
      <div className="max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Live Tracking</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Shipments currently assigned, picked up, or in transit</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span>{filtered.length} active shipments</span>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Active Shipments List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search active shipments..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="bg-card border border-border rounded-xl p-4 animate-pulse h-24" />
                ))
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No active shipments</div>
              ) : (
                filtered.map((shipment, idx) => {
                  const sc = STATUS_CONFIG[shipment.status];
                  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  const isSelected = selectedId === shipment._id;
                  return (
                    <button
                      key={shipment._id}
                      onClick={() => setSelectedId(shipment._id)}
                      className={`w-full text-left bg-card border rounded-xl p-4 transition-all ${
                        isSelected ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-700 shrink-0`}>
                            {shipment.courier ? initialsOf(shipment.courier.name) : '—'}
                          </div>
                          <div>
                            <p className="text-xs font-700 text-foreground">{shipment.courier?.name ?? 'Unassigned'}</p>
                            <p className="text-[10px] text-muted-foreground">{shipment.courier?.vehicle ?? '—'}</p>
                          </div>
                        </div>
                        {sc && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-600 ${sc.className}`}>
                            {sc.icon}{sc.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-700 text-foreground font-mono">{shipment.trackingNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{shipment.recipient}</p>
                      <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
                        <span className="truncate max-w-[100px]">{shipment.origin.split(',')[0]} → {shipment.destination.split(',')[0]}</span>
                        <span className="flex items-center gap-1 shrink-0"><Clock size={9} />ETA {formatEta(shipment.eta)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Detail Panel */}
          <div className="lg:col-span-2 space-y-4">
            {!selected ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-sm">
                {loading ? 'Loading shipments…' : 'Select a shipment to see details'}
              </div>
            ) : (
              <>
                {/* GPS not available placeholder */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="relative h-64 bg-gradient-to-br from-muted/60 to-muted/20 flex items-center justify-center">
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(0deg, transparent, transparent 39px, var(--border) 39px, var(--border) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, var(--border) 39px, var(--border) 40px)',
                      }}
                    />
                    <div className="relative text-center space-y-3 px-6">
                      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <Navigation size={24} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-700 text-foreground">Live GPS tracking isn&apos;t connected yet</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                          Courier location pings aren&apos;t wired up on the backend yet — this map will show real-time position once that&apos;s available.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><MapPin size={12} className="text-primary" />{selected.origin.split(',')[0]}</span>
                      <span>→</span>
                      <span className="flex items-center gap-1.5"><MapPin size={12} className="text-success" />{selected.destination.split(',')[0]}</span>
                    </div>
                    <span className="text-xs font-600 text-foreground">ETA {formatEta(selected.eta)}</span>
                  </div>
                </div>

                {/* Shipment Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Tracking #', value: selected.trackingNumber },
                    { label: 'Courier', value: selected.courier?.name ?? 'Unassigned' },
                    { label: 'Vehicle', value: selected.courier?.vehicle ?? '—' },
                    { label: 'Weight', value: `${selected.weightKg} kg` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-card border border-border rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-700 text-foreground mt-1 truncate">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Status */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-700 text-foreground">Current Status</p>
                    {STATUS_CONFIG[selected.status] && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600 ${STATUS_CONFIG[selected.status].className}`}>
                        {STATUS_CONFIG[selected.status].icon}{STATUS_CONFIG[selected.status].label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created {formatEventTime(selected.createdAt)}
                    {' · '}Last updated {formatEventTime(selected.updatedAt)}
                  </p>
                  {selected.notes && (
                    <p className="text-xs text-muted-foreground mt-3 bg-muted/40 rounded-lg p-3">{selected.notes}</p>
                  )}
                </div>

                {/* Tracking Timeline — now real */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <p className="text-sm font-700 text-foreground mb-4">Tracking Timeline</p>
                  {eventsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={`event-skeleton-${i}`} className="h-4 bg-muted rounded animate-pulse w-2/3" />
                      ))}
                    </div>
                  ) : eventsError ? (
                    <p className="text-xs text-danger">{eventsError}</p>
                  ) : events.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No status history recorded yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {[...events].reverse().map((event, idx) => (
                        <div key={`${event.status}-${event.changedAt}-${idx}`} className="flex items-start gap-3">
                          <div className="mt-0.5 h-2 w-2 rounded-full shrink-0 bg-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-600 text-foreground capitalize">{event.status.replace('_', ' ')}</p>
                              <span className="text-xs text-muted-foreground shrink-0">{formatEventTime(event.changedAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}