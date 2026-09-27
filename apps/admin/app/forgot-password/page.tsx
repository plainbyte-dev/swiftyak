'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Loader2, AlertCircle, ArrowLeft, MailCheck } from 'lucide-react';
import { forgotPassword, ApiError } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function handleChange(value: string) {
    setEmail(value);
    if (fieldError) setFieldError(null);
    if (formError) setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setFieldError('Email is required');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setFieldError('Enter a valid email address');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await forgotPassword(trimmed);
      setSentTo(trimmed);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setFormError('Too many requests. Please wait a few minutes and try again.');
        } else {
          setFormError(err.message || 'Something went wrong. Please try again.');
        }
      } else {
        setFormError('Unable to reach the server. Check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <AppLogo size={36} />
          <span className="font-bold text-lg text-foreground tracking-tight">CourierDesk</span>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-card p-6">
          {sentTo ? (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <MailCheck size={20} />
              </div>
              <h1 className="text-lg font-700 text-foreground">Check your email</h1>
              <p className="text-xs text-muted-foreground">
                If an account exists for <span className="font-600 text-foreground">{sentTo}</span>, we&apos;ve
                sent a link to reset your password. The link expires in 60 minutes.
              </p>
              <button
                type="button"
                onClick={() => setSentTo(null)}
                className="text-[11px] text-primary hover:underline"
              >
                Didn&apos;t get it? Try again
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-lg font-700 text-foreground">Forgot password</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your account email and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
                >
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-600 text-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => handleChange(e.target.value)}
                    aria-invalid={!!fieldError}
                    aria-describedby={fieldError ? 'email-error' : undefined}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors duration-150 ${
                      fieldError ? 'border-destructive' : 'border-border'
                    }`}
                  />
                  {fieldError && (
                    <p id="email-error" className="text-[11px] text-destructive">
                      {fieldError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-600 text-black hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? 'Sending link…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>

        <Link
          href="/login"
          className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={13} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
