'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Truck, Plus, Search, MoreHorizontal, Edit2, Trash2, CheckCircle, X, ChevronLeft, ChevronRight, MapPin, Phone, WifiOff, Eye, Loader2, AlertCircle } from 'lucide-react';
import {
  getCouriers,
  createCourier,
  updateCourier,
  updateCourierStatus as updateCourierStatusApi,
  deleteCourier,
  ApiError,
} from '@/lib/api';
import type { ApiCourier } from '@/lib/types';
import type { CourierStatus } from '@/components/ui/StatusBadge';

const STATUS_CONFIG: Record<CourierStatus, { label: string; icon: React.ReactNode; className: string; dot: string }> = {
  available: { label: 'Available', icon: <CheckCircle size={11} />, className: 'text-success bg-success/10', dot: 'bg-success' },
  busy: { label: 'On Delivery', icon: <Truck size={11} />, className: 'text-warning bg-warning/10', dot: 'bg-warning' },
  offline: { label: 'Offline', icon: <WifiOff size={11} />, className: 'text-muted-foreground bg-muted', dot: 'bg-muted-foreground' },
};

const VEHICLE_ICONS: Record<string, string> = {
  Motorcycle: '🏍️',
  Van: '🚐',
  Bicycle: '🚲',
  Car: '🚗',
  Truck: '🚛',
};

const AVATAR_COLORS = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning', 'bg-destructive', 'bg-primary/70', 'bg-info/70'];

const EMPTY_FORM = { name: '', phone: '', vehicle: 'Motorcycle', location: '' };

const PER_PAGE = 6;

function minutesAgo(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function formatAgo(mins: number) {
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ago`;
}

export default function CouriersPage() {
  const [couriers, setCouriers] = useState<ApiCourier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourierStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiCourier | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<ApiCourier | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch all couriers (endpoint only supports server-side status filter,
  // so we fetch by current status filter and do search client-side) ────────
  const fetchCouriers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCouriers(statusFilter === 'all' ? undefined : statusFilter);
      setCouriers(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the CourierDesk API');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filtered = couriers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.vehicle.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const statusCounts = {
    all: couriers.length,
    available: couriers.filter((c) => c.status === 'available').length,
    busy: couriers.filter((c) => c.status === 'busy').length,
    offline: couriers.filter((c) => c.status === 'offline').length,
  };

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setModalOpen(true);
  }

  function openEdit(c: ApiCourier) {
    setEditTarget(c);
    setForm({ name: c.name, phone: c.phone ?? '', vehicle: c.vehicle, location: c.location ?? '' });
    setSaveError(null);
    setModalOpen(true);
    setMenuOpen(null);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setSaveError('Name is required.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      if (editTarget) {
        const { data: updated } = await updateCourier(editTarget._id, {
          name: form.name.trim(),
          vehicle: form.vehicle as ApiCourier['vehicle'],
          location: form.location.trim() || undefined,
          phone: form.phone.trim() || undefined,
        });
        setCouriers((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      } else {
        const { data: created } = await createCourier({
          name: form.name.trim(),
          vehicle: form.vehicle,
          location: form.location.trim() || undefined,
          phone: form.phone.trim() || undefined,
        });
        setCouriers((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save courier. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setActionError(null);
    setMenuOpen(null);
    setDeletingId(id);
    try {
      await deleteCourier(id);
      setCouriers((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      // API blocks deletion if the courier has active shipments — surface that clearly.
      setActionError(
        err instanceof ApiError
          ? err.message
          : 'Failed to remove courier. They may have active shipments assigned.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function setStatus(id: string, status: CourierStatus) {
    setActionError(null);
    setMenuOpen(null);
    try {
      const { data: updated } = await updateCourierStatusApi(id, status);
      setCouriers((prev) => prev.map((c) => (c._id === id ? updated : c)));
      if (viewTarget?._id === id) setViewTarget(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update status.');
    }
  }

  return (
    <AppLayout activePath="/couriers">
      <div className="max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Couriers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage courier fleet, availability, and assignments</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 transition-colors">
            <Plus size={16} /> Add Courier
          </button>
        </div>

        {actionError && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle size={14} className="shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Couriers', value: statusCounts.all, color: 'text-foreground' },
            { label: 'Available', value: statusCounts.available, color: 'text-success' },
            { label: 'On Delivery', value: statusCounts.busy, color: 'text-warning' },
            { label: 'Offline', value: statusCounts.offline, color: 'text-muted-foreground' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-700 mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search couriers..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'available', 'busy', 'offline'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-xs font-600 rounded-lg capitalize transition-colors ${
                  statusFilter === s ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {s === 'all' ? 'All' : s === 'busy' ? 'On Delivery' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="bg-card border border-border rounded-xl p-5 animate-pulse h-48">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-11 w-11 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-2.5 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 w-full bg-muted rounded" />
                  <div className="h-2.5 w-2/3 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-16 text-center text-danger text-sm">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((courier, idx) => {
              const sc = STATUS_CONFIG[courier.status];
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <div key={courier._id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`h-11 w-11 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-700`}>
                          {courier.initials}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${sc.dot}`} />
                      </div>
                      <div>
                        <p className="font-700 text-foreground">{courier.name}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-600 ${sc.className}`}>
                          {sc.icon}{sc.label}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === courier._id ? null : courier._id)}
                        disabled={deletingId === courier._id}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
                      >
                        {deletingId === courier._id ? <Loader2 size={15} className="animate-spin" /> : <MoreHorizontal size={15} />}
                      </button>
                      {menuOpen === courier._id && (
                        <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px]">
                          <button onClick={() => { setViewTarget(courier); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted text-foreground">
                            <Eye size={14} />View Details
                          </button>
                          <button onClick={() => openEdit(courier)} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted text-foreground">
                            <Edit2 size={14} />Edit
                          </button>
                          {courier.status !== 'available' && (
                            <button onClick={() => setStatus(courier._id, 'available')} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted text-success">
                              <CheckCircle size={14} />Set Available
                            </button>
                          )}
                          {courier.status !== 'offline' && (
                            <button onClick={() => setStatus(courier._id, 'offline')} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted text-muted-foreground">
                              <WifiOff size={14} />Set Offline
                            </button>
                          )}
                          <button onClick={() => handleDelete(courier._id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted text-destructive">
                            <Trash2 size={14} />Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{VEHICLE_ICONS[courier.vehicle] || '🚗'}</span>
                      <span>{courier.vehicle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={12} />
                      <span className="truncate">{courier.location}</span>
                    </div>
                    {courier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} />
                        <span>{courier.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Current job</p>
                      <p className="text-sm font-700 text-foreground truncate">{courier.currentShipment || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Deliveries left</p>
                      <p className="text-sm font-700 text-foreground">{courier.deliveriesLeft ?? '—'}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Last ping: {formatAgo(minutesAgo(courier.lastPingAt))}
                  </p>
                </div>
              );
            })}
            {paginated.length === 0 && (
              <div className="col-span-3 py-16 text-center text-muted-foreground text-sm">No couriers found</div>
            )}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} couriers</p>
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-700 text-foreground">{editTarget ? 'Edit Courier' : 'Add Courier'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {saveError && (
                <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}
              {[
                { label: 'Full Name', key: 'name', placeholder: 'e.g. John Smith' },
                { label: 'Phone', key: 'phone', placeholder: '+1 212-555-0000' },
                { label: 'Location', key: 'location', placeholder: 'e.g. Canal St & Broadway, NY' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-600 text-muted-foreground mb-1.5">{label}</label>
                  <input
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-600 text-muted-foreground mb-1.5">Vehicle Type</label>
                <select
                  value={form.vehicle}
                  onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {['Motorcycle', 'Bicycle', 'Car', 'Van', 'Truck'].map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
              {/* Status is intentionally not editable here — it's managed via the
                  dedicated PATCH /couriers/:id/status endpoint, triggered from the
                  card menu (Set Available / Set Offline), not the create/edit form. */}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setModalOpen(false)} disabled={saving} className="px-4 py-2 text-sm font-600 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-600 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Courier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-700 text-foreground">Courier Details</h2>
              <button onClick={() => setViewTarget(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-700">{viewTarget.initials}</div>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card ${STATUS_CONFIG[viewTarget.status].dot}`} />
                </div>
                <div>
                  <h3 className="font-700 text-foreground text-lg">{viewTarget.name}</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-600 ${STATUS_CONFIG[viewTarget.status].className}`}>
                    {STATUS_CONFIG[viewTarget.status].icon}{STATUS_CONFIG[viewTarget.status].label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Vehicle', value: `${VEHICLE_ICONS[viewTarget.vehicle] || ''} ${viewTarget.vehicle}` },
                  { label: 'Phone', value: viewTarget.phone || '—' },
                  { label: 'Location', value: viewTarget.location },
                  { label: 'Current job', value: viewTarget.currentShipment || '—' },
                  { label: 'Deliveries left', value: viewTarget.deliveriesLeft != null ? String(viewTarget.deliveriesLeft) : '—' },
                  { label: 'Last ping', value: formatAgo(minutesAgo(viewTarget.lastPingAt)) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-sm font-600 text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </AppLayout>
  );
}