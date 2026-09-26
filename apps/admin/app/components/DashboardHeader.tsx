'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Download, Plus, Bell, Package, Truck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import NewShipmentModal from './NewShipmentModal';
import { getShipments, ApiError } from '@/lib/api';
import type { ApiShipment } from '@/lib/types';

interface NotificationItem {
  id: string;
  icon: React.ElementType;
  iconClass: string;
  title: string;
  time: string;
}

// Placeholder until a real /api/notifications endpoint exists.
const NOTIFICATIONS: NotificationItem[] = [
  { id: '1', icon: Package, iconClass: 'text-primary', title: 'New shipment #SH-2291 created', time: '5m ago' },
  { id: '2', icon: Truck, iconClass: 'text-positive', title: 'Courier Marcus assigned to SH-2287', time: '22m ago' },
  { id: '3', icon: AlertTriangle, iconClass: 'text-danger', title: 'Shipment SH-2280 delayed', time: '1h ago' },
];

function toCsv(shipments: ApiShipment[]) {
  const headers = ['Tracking Number', 'Recipient', 'Origin', 'Destination', 'Status', 'Weight (kg)', 'Created At'];
  const escape = (val: unknown) => {
    const s = String(val ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = shipments.map((s) => [
    s.trackingNumber, s.recipient, s.origin, s.destination, s.status, s.weightKg, s.createdAt,
  ].map(escape).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function DashboardHeader() {
  const router = useRouter();
  const [showNewShipment, setShowNewShipment] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      router.refresh();
    } finally {
      // router.refresh() doesn't return a promise that resolves on completion,
      // so give the spinner a beat to reflect that something happened.
      setTimeout(() => setRefreshing(false), 600);
    }
  }

  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      const { data } = await getShipments({ perPage: 1000 });
      const csv = toCsv(data);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(csv, `shipments-${stamp}.csv`);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : 'Failed to export report.');
    } finally {
      setExporting(false);
    }
  }

  function handleShipmentCreated(_shipment: ApiShipment) {
    router.refresh();
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-700 text-foreground tracking-tight">
          Operations Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Meridian Logistics Co. ·{' '}
          <span className="text-positive font-500">Live</span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-positive ml-1 pulse-dot align-middle" />
          <span className="text-muted-foreground ml-2">
            Last updated: Jul 23, 2026, 05:56 AM
          </span>
        </p>
        {exportError && (
          <p className="text-xs text-destructive mt-1">{exportError}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            className="btn-secondary relative"
            title="View notifications"
            onClick={() => setNotifOpen((o) => !o)}
          >
            <Bell size={15} />
            {NOTIFICATIONS.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-danger text-white text-[9px] font-700 flex items-center justify-center">
                {NOTIFICATIONS.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-border bg-card shadow-lg z-40 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-700 text-foreground">Notifications</p>
                {NOTIFICATIONS.length > 0 && (
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => setNotifOpen(false)}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {NOTIFICATIONS.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <CheckCircle2 size={20} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">You're all caught up</p>
                  </div>
                ) : (
                  NOTIFICATIONS.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted transition-colors">
                        <Icon size={16} className={`${n.iconClass} shrink-0 mt-0.5`} />
                        <div className="min-w-0">
                          <p className="text-xs font-600 text-foreground leading-snug">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Refresh */}
        <button
          className="btn-secondary"
          title="Refresh dashboard data"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
        </button>

        {/* Export */}
        <button
          className="btn-secondary"
          title="Export report"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download size={15} className={exporting ? 'animate-pulse' : ''} />
          <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export'}</span>
        </button>

        <button className="btn-primary" onClick={() => setShowNewShipment(true)}>
          <Plus size={15} />
          New Shipment
        </button>
      </div>

      <NewShipmentModal
        open={showNewShipment}
        onClose={() => setShowNewShipment(false)}
        onCreated={handleShipmentCreated}
      />
    </div>
  );
}