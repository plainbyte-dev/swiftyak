'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '@/components/AppLayout';
import { Plus, Search, Eye, ChevronLeft, ChevronRight, MapPin, User, ArrowRight, ChevronDown, AlertCircle, Printer, ArrowLeft, ScanLine, Loader2, FileSpreadsheet, Receipt } from 'lucide-react';
import { ShipmentStatusBadge, ShipmentStatus } from '@/components/ui/StatusBadge';
import {
  getShipments,
  getCouriers,
  assignCourier as assignCourierApi,
  updateShipmentStatus as updateShipmentStatusApi,
  ApiError,
  type GetShipmentsParams,
} from '@/lib/api';
import type { ApiShipment, ApiCourier } from '@/lib/types';
import NewShipmentModal from '@/app/components/NewShipmentModal';
import ShipmentLabel, { ShipmentLabelData } from '@/app/components/ShipmentLabel';
import BarcodeScannerModal from '@/app/components/BarCodeScannerModal';
import { exportShipmentManifest, exportInvoiceList } from '@/lib/export';

const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['assigned', 'cancelled'],
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'failed'],
  in_transit: ['delivered', 'failed'],
  delivered: [],
  failed: ['pending'],
  cancelled: [],
};

const STATUS_FILTERS: { key: ShipmentStatus | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'Total', color: 'text-foreground' },
  { key: 'pending', label: 'Pending', color: 'text-warning' },
  { key: 'in_transit', label: 'In Transit', color: 'text-info' },
  { key: 'delivered', label: 'Delivered', color: 'text-success' },
  { key: 'failed', label: 'Failed', color: 'text-destructive' },
];

const PER_PAGE = 8;

// Builds label data from an ApiShipment. Falls back to sensible defaults for
// shipments created before sender/consignee/freight details existed.
function toLabelData(shipment: ApiShipment): ShipmentLabelData {
  const { sender, consignee, freight } = shipment;
  return {
    trackingNumber: shipment.trackingNumber,
    originCountry: sender?.countryCode || shipment.origin.split(',').pop()?.trim().slice(0, 3).toUpperCase() || '—',
    destinationCountry: consignee?.countryCode || shipment.destination.split(',').pop()?.trim().slice(0, 3).toUpperCase() || '—',
    pieces: freight?.pieces ?? 1,
    actualWeightKg: shipment.weightKg,
    volumetricWeightKg: freight?.volumetricWeightKg ?? shipment.weightKg,
    declaredValueUsd: freight?.declaredValueUsd ?? 0,
    contentType: freight?.contentType ?? 'Non-Doc',
    description: freight?.descriptionOfGoods || shipment.notes || '—',
    sender: {
      name: sender?.name || 'Sender',
      addressLines: [sender?.address1, sender?.address2].filter((l): l is string => !!l).length
        ? [sender?.address1, sender?.address2].filter((l): l is string => !!l)
        : [shipment.origin],
      phone: sender?.phone ?? '',
    },
    receiver: {
      name: consignee?.name || shipment.recipient,
      address: consignee?.address1 || shipment.destination,
      city: consignee?.city ?? '',
      country: consignee?.country ?? '',
      phone: consignee?.phone || shipment.phone || '',
    },
    orderCreationDate: new Date(shipment.createdAt).toLocaleDateString('en-US'),
  };
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<ApiShipment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [couriers, setCouriers] = useState<ApiCourier[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generatingInvoices, setGeneratingInvoices] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [viewTarget, setViewTarget] = useState<ApiShipment | null>(null);
  const [showLabel, setShowLabel] = useState(false);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dropdowns are rendered in a portal (see below) so they always drop
  // downward from the trigger and are never clipped by the table's scroll
  // container, even for rows near the bottom of the list.
  function openMenu(e: React.MouseEvent<HTMLButtonElement>, id: string, current: string | null, setOpen: (id: string | null) => void) {
    if (current === id) {
      setOpen(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left });
    setOpen(id);
  }

  useEffect(() => {
    if (!assignOpen && !statusOpen) return;
    function close() {
      setAssignOpen(null);
      setStatusOpen(null);
    }
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [assignOpen, statusOpen]);

  // ── Fetch shipments (search/status/page-aware) ──────────────────────────
  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: GetShipmentsParams = {
        search: search || undefined,
        status: statusFilter,
        sortKey: 'createdAt',
        sortDir: 'desc',
        page,
        perPage: PER_PAGE,
      };
      const res = await getShipments(params);
      setShipments(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the CourierDesk API');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Debounce search input → reset to page 1 and refetch
  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), 400);
  }

  // ── Handle a barcode scan: fill search with the decoded tracking # ──────
  function handleScan(value: string) {
    setScannerOpen(false);
    setSearch(value);
    setPage(1);
  }

  // ── Fetch couriers once, for the assign dropdown ─────────────────────────
  useEffect(() => {
    getCouriers()
      .then((res) => setCouriers(res.data))
      .catch(() => {
        // Non-fatal — assign dropdown will just show no options.
      });
  }, []);

  // ── Fetch per-status counts for the stat cards ───────────────────────────
  const refreshCounts = useCallback(async () => {
    try {
      const results = await Promise.all(
        STATUS_FILTERS.map((f) =>
          getShipments({ status: f.key, perPage: 1 }).then((res) => [f.key, res.pagination.total] as const)
        )
      );
      setStatusCounts(Object.fromEntries(results));
    } catch {
      // Non-fatal — cards just won't show counts.
    }
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  // ── Handle shipment created via NewShipmentModal ─────────────────────────
  async function handleShipmentCreated(_created: ApiShipment) {
    setModalOpen(false);
    setPage(1);
    await Promise.all([fetchShipments(), refreshCounts()]);
  }

  // Exports operate on the full filtered set, not just the current page —
  // reuses the same search/status filter as the table.
  async function fetchAllFilteredShipments() {
    const res = await getShipments({ search, status: statusFilter, perPage: 1000 });
    return res.data;
  }

  async function handleExportManifest() {
    setExportError(null);
    setExporting(true);
    try {
      const all = await fetchAllFilteredShipments();
      await exportShipmentManifest(all);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : 'Failed to export manifest.');
    } finally {
      setExporting(false);
    }
  }

  async function handleGenerateInvoices() {
    setExportError(null);
    setGeneratingInvoices(true);
    try {
      const all = await fetchAllFilteredShipments();
      await exportInvoiceList(all);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : 'Failed to generate invoices.');
    } finally {
      setGeneratingInvoices(false);
    }
  }

  // ── Assign courier ───────────────────────────────────────────────────────
  async function handleAssign(shipmentId: string, courierId: string) {
    setActionError(null);
    setAssignOpen(null);
    try {
      const { data: updated } = await assignCourierApi(shipmentId, courierId);
      setShipments((prev) => prev.map((s) => (s._id === shipmentId ? updated : s)));
      if (viewTarget?._id === shipmentId) setViewTarget(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to assign courier.');
    }
  }

  // ── Update status ────────────────────────────────────────────────────────
  async function handleStatusUpdate(shipmentId: string, newStatus: ShipmentStatus) {
    setActionError(null);
    setStatusOpen(null);
    try {
      const { data: updated } = await updateShipmentStatusApi(shipmentId, newStatus);
      setShipments((prev) => prev.map((s) => (s._id === shipmentId ? updated : s)));
      if (viewTarget?._id === shipmentId) setViewTarget(updated);
      refreshCounts();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update status. That transition may not be allowed.');
    }
  }

  function openDetail(shipment: ApiShipment) {
    setViewTarget(shipment);
    setShowLabel(false);
  }

  function closeDetail() {
    setViewTarget(null);
    setShowLabel(false);
  }

  return (
    <AppLayout activePath="/shipments">
      <div className="max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Shipments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create, assign, and track all shipments</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> New Shipment
          </button>
        </div>

        {actionError && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle size={14} className="shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STATUS_FILTERS.map((stat) => (
            <button
              key={stat.key}
              onClick={() => { setStatusFilter(stat.key); setPage(1); }}
              className={`bg-card border rounded-xl p-4 text-left transition-all ${
                statusFilter === stat.key ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:border-primary/40'
              }`}
            >
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-700 mt-1 ${stat.color}`}>
                {statusCounts[stat.key] ?? '—'}
              </p>
            </button>
          ))}
        </div>

        {/* Search + Scan + Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 max-w-sm">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by tracking #, recipient, courier..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={() => setScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-600 bg-card border border-border rounded-lg hover:bg-muted transition-colors shrink-0"
            >
              <ScanLine size={14} /> Scan
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportManifest}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-600 bg-card border border-border rounded-lg hover:bg-muted transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              {exporting ? 'Exporting…' : 'Export Manifest'}
            </button>
            <button
              onClick={handleGenerateInvoices}
              disabled={generatingInvoices}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-600 bg-card border border-border rounded-lg hover:bg-muted transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generatingInvoices ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
              {generatingInvoices ? 'Generating…' : 'Generate Invoices'}
            </button>
          </div>
        </div>

        {exportError && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle size={14} className="shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Tracking #</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Recipient</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Route</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Courier</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">ETA</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td colSpan={7} className="px-5 py-4">
                        <div className="h-4 bg-muted rounded animate-pulse w-full" />
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-danger text-sm">{error}</td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">No shipments found</td>
                  </tr>
                ) : (
                  shipments.map((shipment) => {
                    const transitions = STATUS_TRANSITIONS[shipment.status];
                    return (
                      <tr key={shipment._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-700 text-foreground font-mono text-xs">{shipment.trackingNumber}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(shipment.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-600 text-foreground">{shipment.recipient}</p>
                          <p className="text-xs text-muted-foreground">{shipment.weightKg} kg</p>
                        </td>
                        <td className="px-5 py-3.5 max-w-[180px]">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="truncate max-w-[70px]">{shipment.origin.split(',')[0]}</span>
                            <ArrowRight size={10} className="shrink-0" />
                            <span className="truncate max-w-[70px]">{shipment.destination.split(',')[0]}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="relative">
                            <button
                              onClick={(e) => openMenu(e, shipment._id, assignOpen, setAssignOpen)}
                              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                                shipment.courier ? 'border-border text-foreground hover:bg-muted' : 'border-dashed border-warning text-warning hover:bg-warning/5'
                              }`}
                            >
                              <User size={11} />
                              <span>{shipment.courier?.name || 'Assign'}</span>
                              <ChevronDown size={10} />
                            </button>
                            {assignOpen === shipment._id && menuPos && createPortal(
                              <div
                                style={{ top: menuPos.top, left: menuPos.left }}
                                className="fixed z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[180px]"
                              >
                                {couriers.length === 0 ? (
                                  <p className="px-4 py-2 text-xs text-muted-foreground">No couriers available</p>
                                ) : (
                                  couriers.map((c) => (
                                    <button
                                      key={c._id}
                                      onClick={() => handleAssign(shipment._id, c._id)}
                                      className="flex items-center justify-between w-full px-4 py-2 text-xs hover:bg-muted text-foreground"
                                    >
                                      <span className="font-600">{c.name}</span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-600 ${
                                          c.status === 'available' ? 'text-success bg-success/10'
                                            : c.status === 'busy' ? 'text-warning bg-warning/10'
                                            : 'text-muted-foreground bg-muted'
                                        }`}
                                      >
                                        {c.vehicle}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>,
                              document.body
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="relative">
                            {transitions.length > 0 ? (
                              <button onClick={(e) => openMenu(e, shipment._id, statusOpen, setStatusOpen)} className="group">
                                <ShipmentStatusBadge status={shipment.status} />
                              </button>
                            ) : (
                              <ShipmentStatusBadge status={shipment.status} />
                            )}
                            {statusOpen === shipment._id && transitions.length > 0 && menuPos && createPortal(
                              <div
                                style={{ top: menuPos.top, left: menuPos.left }}
                                className="fixed z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px]"
                              >
                                {transitions.map((t) => (
                                  <button key={t} onClick={() => handleStatusUpdate(shipment._id, t)} className="flex items-center gap-2 w-full px-4 py-2 text-xs hover:bg-muted text-foreground">
                                    <ArrowRight size={11} /><span className="capitalize">{t.replace('_', ' ')}</span>
                                  </button>
                                ))}
                              </div>,
                              document.body
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          {shipment.eta ? new Date(shipment.eta).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Unassigned'}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openDetail(shipment)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="View details">
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => { setViewTarget(shipment); setShowLabel(true); }}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Print label"
                            >
                              <Printer size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">{total} shipments</p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-600">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Shipment Modal */}
      <NewShipmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleShipmentCreated}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />

      {/* Detail / Label Modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`bg-card border border-border rounded-2xl shadow-xl w-full ${showLabel ? 'max-w-3xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card no-print">
              <div className="flex items-center gap-2">
                {showLabel && (
                  <button onClick={() => setShowLabel(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Back to details">
                    <ArrowLeft size={16} />
                  </button>
                )}
                <div>
                  <h2 className="text-base font-700 text-foreground">{viewTarget.trackingNumber}</h2>
                  <p className="text-xs text-muted-foreground">
                    {new Date(viewTarget.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!showLabel && (
                  <button
                    onClick={() => setShowLabel(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-600 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Printer size={13} /> View Label
                  </button>
                )}
                <button onClick={closeDetail} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">✕</button>
              </div>
            </div>

            {showLabel ? (
              <div className="px-6 py-5">
                <ShipmentLabel data={toLabelData(viewTarget)} />
              </div>
            ) : (
              <div className="px-6 py-5 space-y-5">
                <div className="flex items-center justify-between">
                  <ShipmentStatusBadge status={viewTarget.status} />
                  <span className="text-xs text-muted-foreground">{viewTarget.weightKg} kg</span>
                </div>
                <div className="bg-muted/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pickup</p>
                      <p className="text-sm font-600 text-foreground">{viewTarget.origin}</p>
                    </div>
                  </div>
                  <div className="ml-[3px] h-6 w-px bg-border" />
                  <div className="flex items-start gap-3">
                    <MapPin size={14} className="mt-0.5 text-success shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Delivery</p>
                      <p className="text-sm font-600 text-foreground">{viewTarget.destination}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Recipient', value: viewTarget.recipient },
                    { label: 'Phone', value: viewTarget.phone || '—' },
                    { label: 'Courier', value: viewTarget.courier?.name || 'Unassigned' },
                    { label: 'ETA', value: viewTarget.eta ? new Date(viewTarget.eta).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/40 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className="text-sm font-600 text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
                {viewTarget.notes && (
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground">{viewTarget.notes}</p>
                  </div>
                )}
                {STATUS_TRANSITIONS[viewTarget.status].length > 0 && (
                  <div>
                    <p className="text-xs font-600 text-muted-foreground mb-2">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_TRANSITIONS[viewTarget.status].map((t) => (
                        <button
                          key={t}
                          onClick={() => handleStatusUpdate(viewTarget._id, t)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-600 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors capitalize"
                        >
                          <ArrowRight size={11} />{t.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {(assignOpen || statusOpen) && <div className="fixed inset-0 z-10" onClick={() => { setAssignOpen(null); setStatusOpen(null); }} />}
    </AppLayout>
  );
}