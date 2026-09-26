'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Building2, Plus, Search, MoreHorizontal, Edit2, Trash2,
  CheckCircle, Clock, XCircle, Phone, Mail, MapPin, X,
  ChevronLeft, ChevronRight, Eye, Loader2, AlertCircle,
} from 'lucide-react';
import {
  getCompanies,
  createCompany,
  updateCompany,
  updateCompanyStatus,
  deleteCompany,
  ApiError,
  type GetCompaniesParams,
} from '@/lib/api';
import type { ApiCompany } from '@/lib/types';

const STATUS_CONFIG = {
  active: { label: 'Active', icon: CheckCircle, className: 'text-success bg-success/10' },
  pending: { label: 'Pending', icon: Clock, className: 'text-warning bg-warning/10' },
  suspended: { label: 'Suspended', icon: XCircle, className: 'text-destructive bg-destructive/10' },
};

const PLAN_COLORS: Record<string, string> = {
  Enterprise: 'text-primary bg-primary/10',
  Business: 'text-info bg-info/10',
  Starter: 'text-muted-foreground bg-muted',
};

const EMPTY_FORM = {
  name: '',
  contact: '',
  email: '',
  phone: '',
  address: '',
  status: 'pending' as ApiCompany['status'],
  plan: 'Starter' as ApiCompany['plan'],
};

const PER_PAGE = 6;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApiCompany['status'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiCompany | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<ApiCompany | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: GetCompaniesParams = { search: search || undefined, status: statusFilter, page, perPage: PER_PAGE };
      const res = await getCompanies(params);
      setCompanies(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the CourierDesk API');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), 400);
  }

  const refreshCounts = useCallback(async () => {
    try {
      const statuses: (ApiCompany['status'] | 'all')[] = ['all', 'active', 'pending', 'suspended'];
      const results = await Promise.all(
        statuses.map((s) => getCompanies({ status: s, perPage: 1 }).then((res) => [s, res.pagination.total] as const))
      );
      setStatusCounts(Object.fromEntries(results));
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setModalOpen(true);
  }

  function openEdit(c: ApiCompany) {
    setEditTarget(c);
    setForm({
      name: c.name,
      contact: c.contact,
      email: c.email,
      phone: c.phone ?? '',
      address: c.address ?? '',
      status: c.status,
      plan: c.plan,
    });
    setSaveError(null);
    setModalOpen(true);
    setMenuOpen(null);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.contact.trim() || !form.email.trim()) {
      setSaveError('Company name, contact, and email are required.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      if (editTarget) {
        const { data: updated } = await updateCompany(editTarget._id, {
          name: form.name.trim(),
          contact: form.contact.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          plan: form.plan,
        });
        setCompanies((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      } else {
        const { data: created } = await createCompany({
          name: form.name.trim(),
          contact: form.contact.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          status: form.status,
          plan: form.plan,
        });
        setCompanies((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      refreshCounts();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save company. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setActionError(null);
    setMenuOpen(null);
    try {
      await deleteCompany(id);
      setCompanies((prev) => prev.filter((c) => c._id !== id));
      refreshCounts();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete company.');
    }
  }

  async function toggleStatus(c: ApiCompany) {
    setActionError(null);
    setMenuOpen(null);
    const next = c.status === 'active' ? 'suspended' : 'active';
    try {
      const { data: updated } = await updateCompanyStatus(c._id, next);
      setCompanies((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      if (viewTarget?._id === c._id) setViewTarget(updated);
      refreshCounts();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update status.');
    }
  }

  return (
    <AppLayout activePath="/companies">
      <div className="max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Companies</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage partner companies and their access</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 transition-colors">
            <Plus size={16} /> Add Company
          </button>
        </div>

        {actionError && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle size={14} className="shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search companies..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'pending', 'suspended'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-2 text-xs font-600 rounded-lg capitalize transition-colors ${
                  statusFilter === s ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Companies', value: statusCounts.all, color: 'text-foreground' },
            { label: 'Active', value: statusCounts.active, color: 'text-success' },
            { label: 'Pending', value: statusCounts.pending, color: 'text-warning' },
            { label: 'Suspended', value: statusCounts.suspended, color: 'text-destructive' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-700 mt-1 ${stat.color}`}>{stat.value ?? '—'}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Company</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Plan</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td colSpan={6} className="px-5 py-4">
                        <div className="h-4 bg-muted rounded animate-pulse w-full" />
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-danger text-sm">{error}</td></tr>
                ) : companies.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">No companies found</td></tr>
                ) : (
                  companies.map((company) => {
                    const sc = STATUS_CONFIG[company.status];
                    const StatusIcon = sc.icon;
                    return (
                      <tr key={company._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 size={16} className="text-primary" />
                            </div>
                            <div>
                              <p className="font-600 text-foreground">{company.name}</p>
                              {company.address && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin size={10} />{company.address}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-500 text-foreground">{company.contact}</p>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail size={10} />{company.email}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600 ${sc.className}`}>
                            <StatusIcon size={11} />{sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-600 ${PLAN_COLORS[company.plan]}`}>{company.plan}</span>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground text-xs">{formatDate(company.createdAt)}</td>
                        <td className="px-5 py-3.5">
                          <div className="relative flex items-center gap-1 justify-end">
                            <button onClick={() => setViewTarget(company)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Eye size={15} /></button>
                            <button onClick={() => setMenuOpen(menuOpen === company._id ? null : company._id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontal size={15} /></button>
                            {menuOpen === company._id && (
                              <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px]">
                                <button onClick={() => openEdit(company)} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted text-foreground"><Edit2 size={14} />Edit</button>
                                <button onClick={() => toggleStatus(company)} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted text-foreground">
                                  {company.status === 'active' ? <><XCircle size={14} />Suspend</> : <><CheckCircle size={14} />Activate</>}
                                </button>
                                <button onClick={() => handleDelete(company._id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted text-destructive"><Trash2 size={14} />Delete</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">{total} companies</p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"><ChevronLeft size={14} /></button>
              <span className="text-xs font-600">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-700 text-foreground">{editTarget ? 'Edit Company' : 'Add Company'}</h2>
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
                { label: 'Company Name', key: 'name', placeholder: 'e.g. Meridian Logistics' },
                { label: 'Contact Person', key: 'contact', placeholder: 'Full name' },
                { label: 'Email', key: 'email', placeholder: 'contact@company.com' },
                { label: 'Phone', key: 'phone', placeholder: '+1 212-555-0000' },
                { label: 'Address', key: 'address', placeholder: '123 Main St, City, State' },
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-600 text-muted-foreground mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ApiCompany['status'] }))}
                    disabled={!!editTarget}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  {editTarget && (
                    <p className="text-[10px] text-muted-foreground mt-1">Use the row menu's Activate/Suspend to change status.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-600 text-muted-foreground mb-1.5">Plan</label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as ApiCompany['plan'] }))}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option>Starter</option>
                    <option>Business</option>
                    <option>Enterprise</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setModalOpen(false)} disabled={saving} className="px-4 py-2 text-sm font-600 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-600 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Company'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-700 text-foreground">Company Details</h2>
              <button onClick={() => setViewTarget(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-700 text-foreground text-lg">{viewTarget.name}</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-600 ${STATUS_CONFIG[viewTarget.status].className}`}>
                    {viewTarget.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Mail size={14} />, label: 'Email', value: viewTarget.email },
                  { icon: <Phone size={14} />, label: 'Phone', value: viewTarget.phone || '—' },
                  { icon: <MapPin size={14} />, label: 'Address', value: viewTarget.address || '—' },
                  { icon: <Building2 size={14} />, label: 'Plan', value: viewTarget.plan },
                  { icon: <Clock size={14} />, label: 'Joined', value: formatDate(viewTarget.createdAt) },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">{icon}<span className="text-xs">{label}</span></div>
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