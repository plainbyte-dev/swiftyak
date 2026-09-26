'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Settings, User, Bell, Shield, Globe, Palette,
  Save, ChevronRight, Moon, Sun, Check, Loader2, AlertCircle,
} from 'lucide-react';
import {
  getMe, updateMe, changePassword, uploadAvatar,
  setupTwoFactor, verifyTwoFactor, disableTwoFactor, ApiError,
} from '@/lib/api';
import type { ApiUser, NotificationPreferences } from '@/lib/types';
import { useTheme } from 'next-themes';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'regional', label: 'Regional', icon: Globe },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo'];
const LANGUAGES = ['English (US)', 'English (UK)', 'French', 'Spanish', 'German'];
const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
const TIME_FORMATS = ['12-hour (AM/PM)', '24-hour'];

function initialsOf(name: string) {
  return name.trim().split(/\s+/).map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('profile');
  const { setTheme: setNextTheme } = useTheme();

  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editable copies — kept separate from `user` so cancelling/switching tabs
  // doesn't require re-fetching, and unsaved edits in one section don't
  // leak into another section's save call.
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', company: '' });
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);
  const [theme, setTheme] = useState<ApiUser['theme']>('system');
  const [regional, setRegional] = useState({ timezone: '', language: '', dateFormat: '', timeFormat: '' });

  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Two-factor authentication
  const [twoFaStep, setTwoFaStep] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [twoFaQr, setTwoFaQr] = useState<string | null>(null);
  const [twoFaSecret, setTwoFaSecret] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaPassword, setTwoFaPassword] = useState('');
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [twoFaBusy, setTwoFaBusy] = useState(false);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { user: me } = await getMe();
      setUser(me);
      setProfileForm({ name: me.name, phone: me.phone, company: me.company });
      setNotifications(me.notifications);
      setTheme(me.theme);
      setNextTheme(me.theme);
      setRegional({ timezone: me.timezone, language: me.language, dateFormat: me.dateFormat, timeFormat: me.timeFormat });
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not reach the CourierDesk API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  async function persist(payload: Parameters<typeof updateMe>[0]) {
    setSaving(true);
    setSaveError(null);
    try {
      const { user: updated } = await updateMe(payload);
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (activeSection === 'profile') {
      persist({ name: profileForm.name.trim(), phone: profileForm.phone.trim(), company: profileForm.company.trim() });
    } else if (activeSection === 'notifications' && notifications) {
      persist({ notifications });
    } else if (activeSection === 'appearance') {
      persist({ theme });
    } else if (activeSection === 'regional') {
      persist(regional);
    }
  }

  async function handleChangePassword() {
    setPasswordError(null);
    if (!passwordForm.current || !passwordForm.next) {
      setPasswordError('Current and new password are required.');
      return;
    }
    if (passwordForm.next.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword({ currentPassword: passwordForm.current, newPassword: passwordForm.next });
      setPasswordForm({ current: '', next: '', confirm: '' });
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5MB.');
      return;
    }

    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const { user: updated } = await uploadAvatar(file);
      setUser(updated);
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : 'Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
      e.target.value = ''; // allow re-selecting the same file later
    }
  }

  async function startTwoFactorSetup() {
    setTwoFaError(null);
    setTwoFaBusy(true);
    try {
      const res = await setupTwoFactor();
      setTwoFaQr(res.qrCode);
      setTwoFaSecret(res.secret);
      setTwoFaStep('setup');
    } catch (err) {
      setTwoFaError(err instanceof ApiError ? err.message : 'Failed to start 2FA setup.');
    } finally {
      setTwoFaBusy(false);
    }
  }

  async function confirmTwoFactorCode() {
    setTwoFaError(null);
    setTwoFaBusy(true);
    try {
      await verifyTwoFactor(twoFaCode);
      setUser((u) => (u ? { ...u, twoFactorEnabled: true } : u));
      setTwoFaStep('idle');
      setTwoFaQr(null);
      setTwoFaSecret(null);
      setTwoFaCode('');
    } catch (err) {
      setTwoFaError(err instanceof ApiError ? err.message : 'Invalid code.');
    } finally {
      setTwoFaBusy(false);
    }
  }

  async function confirmTwoFactorDisable() {
    setTwoFaError(null);
    setTwoFaBusy(true);
    try {
      await disableTwoFactor(twoFaPassword);
      setUser((u) => (u ? { ...u, twoFactorEnabled: false } : u));
      setTwoFaStep('idle');
      setTwoFaPassword('');
    } catch (err) {
      setTwoFaError(err instanceof ApiError ? err.message : 'Failed to disable 2FA.');
    } finally {
      setTwoFaBusy(false);
    }
  }

  function cancelTwoFaFlow() {
    setTwoFaStep('idle');
    setTwoFaQr(null);
    setTwoFaSecret(null);
    setTwoFaCode('');
    setTwoFaPassword('');
    setTwoFaError(null);
  }

  if (loading) {
    return (
      <AppLayout activePath="/settings">
        <div className="max-w-screen-lg mx-auto flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (loadError || !user) {
    return (
      <AppLayout activePath="/settings">
        <div className="max-w-screen-lg mx-auto py-12">
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle size={14} className="shrink-0" />
            <span>{loadError ?? 'Could not load your account.'}</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  const showFooterSave = activeSection !== 'security';

  return (
    <AppLayout activePath="/settings">
      <div className="max-w-screen-lg mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-700 text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account preferences and platform settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Nav */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {SECTIONS.map((section) => {
                const SectionIcon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => { setActiveSection(section.id); setSaveError(null); }}
                    className={`flex items-center justify-between w-full px-4 py-3 text-sm transition-colors border-b border-border last:border-0 ${isActive ? 'bg-primary/5 text-primary font-600' : 'text-foreground hover:bg-muted'}`}
                  >
                    <div className="flex items-center gap-3">
                      <SectionIcon size={16} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                      {section.label}
                    </div>
                    <ChevronRight size={14} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-xl">
              {saveError && activeSection !== 'security' && (
                <div className="px-6 pt-5">
                  <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{saveError}</span>
                  </div>
                </div>
              )}

              {/* Profile */}
              {activeSection === 'profile' && (
                <div>
                  <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-base font-700 text-foreground">Profile Settings</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Update your personal information</p>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-border">
                      <div className="relative h-16 w-16 shrink-0">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-700">
                            {initialsOf(user.name)}
                          </div>
                        )}
                        {avatarUploading && (
                          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                            <Loader2 size={16} className="animate-spin text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-600 text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role} · {user.company}</p>
                        <label className="inline-block mt-1 text-xs font-600 text-primary hover:underline cursor-pointer">
                          Change photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            disabled={avatarUploading}
                            className="hidden"
                          />
                        </label>
                        {avatarError && <p className="text-xs text-destructive mt-1">{avatarError}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-600 text-muted-foreground mb-1.5">Full Name</label>
                        <input
                          value={profileForm.name}
                          onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-600 text-muted-foreground mb-1.5">Email Address</label>
                        <input value={user.email} disabled className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-xs font-600 text-muted-foreground mb-1.5">Phone Number</label>
                        <input
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-600 text-muted-foreground mb-1.5">Company</label>
                        <input
                          value={profileForm.company}
                          onChange={(e) => setProfileForm((f) => ({ ...f, company: e.target.value }))}
                          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-600 text-muted-foreground mb-1.5">Role</label>
                      <input value={user.role} disabled className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeSection === 'notifications' && notifications && (
                <div>
                  <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-base font-700 text-foreground">Notification Preferences</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Choose what alerts you receive</p>
                  </div>
                  <div className="px-6 py-5 space-y-1">
                    {([
                      { key: 'newShipment', label: 'New Shipment Created', desc: 'Get notified when a new shipment is created in your company' },
                      { key: 'statusUpdate', label: 'Status Updates', desc: 'Receive alerts when shipment status changes' },
                      { key: 'courierAlert', label: 'Courier Alerts', desc: 'Notifications for courier assignment and location updates' },
                      { key: 'weeklyReport', label: 'Weekly Summary Report', desc: 'Receive a weekly performance summary every Monday' },
                      { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive critical alerts via SMS (additional charges may apply)' },
                    ] as const).map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-600 text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <button
                          onClick={() => setNotifications((n) => (n ? { ...n, [key]: !n[key] } : n))}
                          className={`relative h-6 w-11 rounded-full transition-colors ${notifications[key] ? 'bg-primary' : 'bg-muted'}`}
                        >
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifications[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security */}
              {activeSection === 'security' && (
                <div>
                  <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-base font-700 text-foreground">Security</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage your password and account security</p>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    {passwordError && (
                      <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-600 text-muted-foreground mb-1.5">Current Password</label>
                      <input
                        type="password"
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-600 text-muted-foreground mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.next}
                        onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-600 text-muted-foreground mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleChangePassword}
                        disabled={passwordSaving}
                        className={`flex items-center gap-2 px-5 py-2 text-sm font-600 rounded-lg transition-all ${passwordSaved ? 'bg-success text-white' : 'bg-primary text-white hover:bg-primary/90'} disabled:opacity-60`}
                      >
                        {passwordSaving && <Loader2 size={14} className="animate-spin" />}
                        {passwordSaved ? <><Check size={15} />Updated!</> : passwordSaving ? 'Updating…' : 'Update Password'}
                      </button>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-600 text-foreground">Two-Factor Authentication</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {user.twoFactorEnabled
                              ? 'Enabled — your account requires a code at login.'
                              : 'Add an extra layer of security to your account'}
                          </p>
                        </div>
                        {twoFaStep === 'idle' && (
                          user.twoFactorEnabled ? (
                            <button
                              onClick={() => setTwoFaStep('disable')}
                              className="px-3 py-1.5 text-xs font-600 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                            >
                              Disable 2FA
                            </button>
                          ) : (
                            <button
                              onClick={startTwoFactorSetup}
                              disabled={twoFaBusy}
                              className="px-3 py-1.5 text-xs font-600 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-60"
                            >
                              {twoFaBusy ? 'Starting…' : 'Enable 2FA'}
                            </button>
                          )
                        )}
                      </div>

                      {twoFaError && (
                        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive mb-3">
                          <AlertCircle size={14} className="shrink-0" />
                          <span>{twoFaError}</span>
                        </div>
                      )}

                      {twoFaStep === 'setup' && twoFaQr && (
                        <div className="space-y-3 pb-3">
                          <p className="text-xs text-muted-foreground">
                            Scan this QR code with your authenticator app, then enter the 6-digit code below.
                          </p>
                          <img src={twoFaQr} alt="Two-factor authentication QR code" className="h-40 w-40 border border-border rounded-lg" />
                          {twoFaSecret && (
                            <p className="text-xs text-muted-foreground">
                              Can't scan it? Enter this key manually: <code className="font-mono">{twoFaSecret}</code>
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <input
                              value={twoFaCode}
                              onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="123456"
                              inputMode="numeric"
                              maxLength={6}
                              className="w-32 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <button
                              onClick={confirmTwoFactorCode}
                              disabled={twoFaBusy || twoFaCode.length !== 6}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-600 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60"
                            >
                              {twoFaBusy && <Loader2 size={14} className="animate-spin" />}
                              {twoFaBusy ? 'Verifying…' : 'Verify & Enable'}
                            </button>
                            <button onClick={cancelTwoFaFlow} className="text-xs text-muted-foreground hover:underline">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {twoFaStep === 'disable' && (
                        <div className="space-y-3 pb-3">
                          <p className="text-xs text-muted-foreground">Enter your password to disable two-factor authentication.</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              value={twoFaPassword}
                              onChange={(e) => setTwoFaPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-48 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <button
                              onClick={confirmTwoFactorDisable}
                              disabled={twoFaBusy || !twoFaPassword}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-600 bg-destructive text-white rounded-lg hover:bg-destructive/90 disabled:opacity-60"
                            >
                              {twoFaBusy && <Loader2 size={14} className="animate-spin" />}
                              {twoFaBusy ? 'Disabling…' : 'Confirm Disable'}
                            </button>
                            <button onClick={cancelTwoFaFlow} className="text-xs text-muted-foreground hover:underline">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance */}
              {activeSection === 'appearance' && (
                <div>
                  <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-base font-700 text-foreground">Appearance</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Customize the look and feel of the dashboard</p>
                  </div>
                  <div className="px-6 py-5 space-y-6">
                    <div>
                      <p className="text-sm font-600 text-foreground mb-3">Theme</p>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { key: 'light', label: 'Light', icon: <Sun size={18} /> },
                          { key: 'dark', label: 'Dark', icon: <Moon size={18} /> },
                          { key: 'system', label: 'System', icon: <Settings size={18} /> },
                        ] as const).map(({ key, label, icon }) => (
                          <button
                            key={key}
                            onClick={() => { setTheme(key); setNextTheme(key); }}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                          >
                            <div className={theme === key ? 'text-primary' : 'text-muted-foreground'}>{icon}</div>
                            <span className={`text-xs font-600 ${theme === key ? 'text-primary' : 'text-foreground'}`}>{label}</span>
                            {theme === key && <Check size={12} className="text-primary" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Regional */}
              {activeSection === 'regional' && (
                <div>
                  <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-base font-700 text-foreground">Regional Settings</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Configure timezone, language, and date formats</p>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div>
                      <label className="block text-xs font-600 text-muted-foreground mb-1.5">Timezone</label>
                      <select
                        value={regional.timezone}
                        onChange={(e) => setRegional((r) => ({ ...r, timezone: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {TIMEZONES.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-600 text-muted-foreground mb-1.5">Language</label>
                      <select
                        value={regional.language}
                        onChange={(e) => setRegional((r) => ({ ...r, language: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {LANGUAGES.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-600 text-muted-foreground mb-1.5">Date Format</label>
                      <select
                        value={regional.dateFormat}
                        onChange={(e) => setRegional((r) => ({ ...r, dateFormat: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {DATE_FORMATS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-600 text-muted-foreground mb-1.5">Time Format</label>
                      <select
                        value={regional.timeFormat}
                        onChange={(e) => setRegional((r) => ({ ...r, timeFormat: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {TIME_FORMATS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button — Security has its own actions above instead */}
              
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}