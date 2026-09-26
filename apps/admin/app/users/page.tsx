'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  MoreHorizontal, Edit2, Trash2, CheckCircle, XCircle, Mail, X,
  ChevronLeft, ChevronRight, Shield, Truck as CourierIcon, Eye, Search,
  User as UserIcon, Loader2, AlertCircle, Plus,
} from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, ApiError, type GetUsersParams } from '@/lib/api';
import type { ApiUser } from '@/lib/types';

const ROLE_CONFIG: Record<ApiUser['role'], { label: string; icon: React.ReactNode; className: string }> = {
  admin: { label: 'Admin', icon: <Shield size={11} />, className: 'text-primary bg-primary/10' },
  dispatcher: { label: 'Dispatcher', icon: <CourierIcon size={11} />, className: 'text-info bg-info/10' },
  viewer: { label: 'Viewer', icon: <UserIcon size={11} />, className: 'text-muted-foreground bg-muted' },
};

const AVATAR_COLORS = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning', 'bg-destructive'];

const PER_PAGE = 7;

function initialsOf(name: string) {
  return name.trim().split(/\s+/).map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

function formatLastLogin(iso: string | null) {
  if (!iso) return 'Never';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<ApiUser['role'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiUser | null>(null);
  const [form, setForm] = useState({ name: '', role: 'viewer' as ApiUser['role'], company: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'viewer' as ApiUser['role'], company: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<ApiUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: GetUsersParams = { search: search || undefined, role: roleFilter, page, perPage: PER_PAGE };
      const res = await getUsers(params);
      setUsers(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the CourierDesk API');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), 400);
  }

  function openEdit(u: ApiUser) {
    setEditTarget(u);
    setForm({ name: u.name, role: u.role, company: u.company });
    setSaveError(null);
    setModalOpen(true);
    setMenuOpen(null);
  }

  async function handleSave() {
    if (!editTarget) return;
    if (!form.name.trim()) {
      setSaveError('Name is required.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const { data: updated } = await updateUser(editTarget._id, {
        name: form.name.trim(),
        role: form.role,
        company: form.company.trim() || undefined,
      });
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      setModalOpen(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save user. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function openAddModal() {
    setAddForm({ name: '', email: '', password: '', role: 'viewer', company: '' });
    setAddError(null);
    setAddModalOpen(true);
  }

  async function handleAddUser() {
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password) {
      setAddError('Name, email, and password are required.');
      return;
    }
    if (addForm.password.length < 8) {
      setAddError('Password must be at least 8 characters.');
      return;
    }

    setAdding(true);
    setAddError(null);
    try {
      await createUser({
        name: addForm.name.trim(),
        email: addForm.email.trim().toLowerCase(),
        password: addForm.password,
        role: addForm.role,
        company: addForm.company.trim() || undefined,
      });
      setAddModalOpen(false);
      await fetchUsers();
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Failed to create user. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setActionError(null);
    setMenuOpen(null);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to remove user.');
    }
  }

  async function toggleActive(u: ApiUser) {
    setActionError(null);
    setMenuOpen(null);
    try {
      const { data: updated } = await updateUser(u._id, { isActive: !u.isActive });
      setUsers((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      if (viewTarget?._id === u._id) setViewTarget(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update user status.');
    }
  }

  const roleCounts = {
    all: total,
    admin: users.filter((u) => u.role === 'admin').length,
    dispatcher: users.filter((u) => u.role === 'dispatcher').length,
    viewer: users.filter((u) => u.role === 'viewer').length,
  };

  return (
    <AppLayout activePath="/users">
      <div className="max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Users</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage account roles and access</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-600 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} />
            Add User
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
            { label: 'Total Users', value: total, color: 'text-foreground' },
            { label: 'Admins', value: roleCounts.admin, color: 'text-primary' },
            { label: 'Dispatchers', value: roleCounts.dispatcher, color: 'text-info' },
            { label: 'Viewers', value: roleCounts.viewer, color: 'text-muted-foreground' },
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
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'admin', 'dispatcher', 'viewer'] as const).map((r) => (
              <button
                key={r}
                onClick={() => { setRoleFilter(r); setPage(1); }}
                className={`px-3 py-2 text-xs font-600 rounded-lg capitalize transition-colors ${
                  roleFilter === r ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {r === 'all' ? 'All Roles' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">User</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Company</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wide">Last Login</th>
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
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">No users found</td></tr>
                ) : (
                  users.map((user, idx) => {
                    const rc = ROLE_CONFIG[user.role];
                    const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                    return (
                      <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-700 shrink-0`}>
                              {initialsOf(user.name)}
                            </div>
                            <div>
                              <p className="font-600 text-foreground">{user.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail size={10} />{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600 ${rc.className}`}>
                            {rc.icon}{rc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-foreground">{user.company}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-600 ${
                            user.isActive ? 'text-success bg-success/10' : 'text-muted-foreground bg-muted'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">{formatLastLogin(user.lastLoginAt)}</td>
                        <td className="px-5 py-3.5">
                          <div className="relative flex items-center gap-1 justify-end">
                            <button onClick={() => setViewTarget(user)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Eye size={15} /></button>
                            <button onClick={() => setMenuOpen(menuOpen === user._id ? null : user._id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontal size={15} /></button>
                            {menuOpen === user._id && (
                              <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px]">
                                <button onClick={() => openEdit(user)} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted text-foreground"><Edit2 size={14} />Edit</button>
                                <button onClick={() => toggleActive(user)} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted text-foreground">
                                  {user.isActive ? <><XCircle size={14} />Deactivate</> : <><CheckCircle size={14} />Activate</>}
                                </button>
                                <button onClick={() => handleDelete(user._id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted text-destructive"><Trash2 size={14} />Remove</button>
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">{total} users</p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"><ChevronLeft size={14} /></button>
              <span className="text-xs font-600">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-700 text-foreground">Add User</h2>
              <button onClick={() => setAddModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {addError && (
                <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{addError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-600 text-muted-foreground mb-1.5">Full Name</label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-600 text-muted-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-600 text-muted-foreground mb-1.5">Temporary Password</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="text-[10px] text-muted-foreground mt-1">At least 8 characters. Share this with the user so they can log in and change it.</p>
              </div>
              <div>
                <label className="block text-xs font-600 text-muted-foreground mb-1.5">Company</label>
                <input
                  value={addForm.company}
                  onChange={(e) => setAddForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-600 text-muted-foreground mb-1.5">Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value as ApiUser['role'] }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="admin">Admin</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setAddModalOpen(false)} disabled={adding} className="px-4 py-2 text-sm font-600 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">Cancel</button>
              <button
                onClick={handleAddUser}
                disabled={adding}
                className="flex items-center gap-2 px-5 py-2 text-sm font-600 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {adding && <Loader2 size={14} className="animate-spin" />}
                {adding ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalOpen && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-700 text-foreground">Edit User</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {saveError && (
                <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-600 text-muted-foreground mb-1.5">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-600 text-muted-foreground mb-1.5">Email</label>
                <input
                  value={editTarget.email}
                  disabled
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed here.</p>
              </div>
              <div>
                <label className="block text-xs font-600 text-muted-foreground mb-1.5">Company</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-600 text-muted-foreground mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as ApiUser['role'] }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="admin">Admin</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="viewer">Viewer</option>
                </select>
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
                {saving ? 'Saving…' : 'Save Changes'}
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
              <h2 className="text-base font-700 text-foreground">User Profile</h2>
              <button onClick={() => setViewTarget(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-700">{initialsOf(viewTarget.name)}</div>
                <div>
                  <h3 className="font-700 text-foreground text-lg">{viewTarget.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewTarget.email}</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-600 mt-1 ${ROLE_CONFIG[viewTarget.role].className}`}>
                    {ROLE_CONFIG[viewTarget.role].icon}{ROLE_CONFIG[viewTarget.role].label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Company', value: viewTarget.company },
                  { label: 'Status', value: viewTarget.isActive ? 'Active' : 'Inactive' },
                  { label: 'Last Login', value: formatLastLogin(viewTarget.lastLoginAt) },
                  { label: 'Joined', value: new Date(viewTarget.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
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