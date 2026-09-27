'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import { inviteUser, resendUserInvite, verifyUserInvite, ApiError } from '@/lib/api';
import type { ApiUser } from '@/lib/types';

interface AddUserModalProps {
  onClose: () => void;
  onCreated: (user: ApiUser) => void;
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30';

/**
 * Two-step "Add User": enter details → a 6-digit code is emailed to the new user →
 * enter the code they read out → the account is created as email-verified.
 */
export default function AddUserModal({ onClose, onCreated }: AddUserModalProps) {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' as ApiUser['role'], company: '' });
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'send' | 'verify' | 'resend' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const codeRef = useRef<HTMLInputElement>(null);

  // Tick once a second while the resend button is on cooldown.
  useEffect(() => {
    if (step !== 'otp' || resendAt <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step, resendAt]);

  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const email = form.email.trim().toLowerCase();

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (error) setError(null);
  }

  async function sendCode() {
    if (!form.name.trim() || !email || !form.password) {
      setError('Name, email, and password are required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy('send');
    setError(null);
    try {
      const res = await inviteUser({
        name: form.name.trim(),
        email,
        password: form.password,
        role: form.role,
        company: form.company.trim() || undefined,
      });
      setStep('otp');
      setCode('');
      setNotice(null);
      setResendAt(Date.now() + res.data.resendAfterSeconds * 1000);
      setNow(Date.now());
      requestAnimationFrame(() => codeRef.current?.focus());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the code. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function resend() {
    setBusy('resend');
    setError(null);
    try {
      const res = await resendUserInvite(email);
      setCode('');
      setNotice(`A new code was sent to ${email}.`);
      setResendAt(Date.now() + res.data.resendAfterSeconds * 1000);
      setNow(Date.now());
      codeRef.current?.focus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend the code.');
    } finally {
      setBusy(null);
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    setBusy('verify');
    setError(null);
    try {
      const { data } = await verifyUserInvite(email, code);
      onCreated(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify the code.');
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-700 text-foreground">Add User</h2>
            <p className="text-[11px] text-muted-foreground">Step {step === 'details' ? 1 : 2} of 2 · {step === 'details' ? 'Details' : 'Verify email'}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
        </div>

        {error && (
          <div role="alert" className="mx-6 mt-5 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'details' ? (
          <>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="au-name" className="block text-xs font-600 text-muted-foreground mb-1.5">Full Name</label>
                <input id="au-name" value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="au-email" className="block text-xs font-600 text-muted-foreground mb-1.5">Email</label>
                <input id="au-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
                <p className="text-[10px] text-muted-foreground mt-1">A 6-digit verification code will be sent to this address.</p>
              </div>
              <div>
                <label htmlFor="au-password" className="block text-xs font-600 text-muted-foreground mb-1.5">Temporary Password</label>
                <input id="au-password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => update('password', e.target.value)} className={inputClass} />
                <p className="text-[10px] text-muted-foreground mt-1">At least 8 characters. Share this with the user so they can log in and change it.</p>
              </div>
              <div>
                <label htmlFor="au-company" className="block text-xs font-600 text-muted-foreground mb-1.5">Company</label>
                <input id="au-company" value={form.company} onChange={(e) => update('company', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="au-role" className="block text-xs font-600 text-muted-foreground mb-1.5">Role</label>
                <select id="au-role" value={form.role} onChange={(e) => update('role', e.target.value)} className={inputClass}>
                  <option value="admin">Admin</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={onClose} disabled={!!busy} className="px-4 py-2 text-sm font-600 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">Cancel</button>
              <button
                onClick={sendCode}
                disabled={!!busy}
                className="flex items-center gap-2 px-5 py-2 text-sm font-600 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {busy === 'send' && <Loader2 size={14} className="animate-spin" />}
                {busy === 'send' ? 'Sending code…' : 'Send verification code'}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={verify}>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/15 p-3">
                <MailCheck size={18} className="text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground">
                  We sent a 6-digit code to <span className="font-600">{email}</span>. Ask {form.name.trim().split(/\s+/)[0] || 'the user'} for the code and enter it below. It expires in 10 minutes.
                </p>
              </div>
              {notice && <p className="text-xs text-success">{notice}</p>}
              <div>
                <label htmlFor="au-code" className="block text-xs font-600 text-muted-foreground mb-1.5">Verification code</label>
                <input
                  id="au-code"
                  ref={codeRef}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); if (error) setError(null); }}
                  placeholder="••••••"
                  className={`${inputClass} text-center text-2xl tracking-[0.5em] font-700 tabular-nums py-3`}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => { setStep('details'); setError(null); }} disabled={!!busy} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-50">
                  <ArrowLeft size={12} /> Change details
                </button>
                <button
                  type="button"
                  onClick={resend}
                  disabled={!!busy || resendIn > 0}
                  className="inline-flex items-center gap-1 font-600 text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {busy === 'resend' && <Loader2 size={12} className="animate-spin" />}
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button type="button" onClick={onClose} disabled={!!busy} className="px-4 py-2 text-sm font-600 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">Cancel</button>
              <button
                type="submit"
                disabled={!!busy || code.length !== 6}
                className="flex items-center gap-2 px-5 py-2 text-sm font-600 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {busy === 'verify' && <Loader2 size={14} className="animate-spin" />}
                {busy === 'verify' ? 'Verifying…' : 'Verify & add user'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
