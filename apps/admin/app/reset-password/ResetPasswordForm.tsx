'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { resetPassword, ApiError } from '@/lib/api';

interface FormState {
  password: string;
  confirmPassword: string;
}

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.password) {
    errors.password = 'Password is required';
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

export default function ResetPasswordForm() {
  const token = useSearchParams().get('token');
  const [form, setForm] = useState<FormState>({ password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (formError) setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await resetPassword({ token, password: form.password });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setFormError('Too many attempts. Please wait a few minutes and try again.');
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

  if (!token) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-card p-6 flex flex-col items-center text-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle size={20} />
        </div>
        <h1 className="text-lg font-700 text-foreground">Invalid reset link</h1>
        <p className="text-xs text-muted-foreground">
          This link is missing its reset token. Request a new link to reset your password.
        </p>
        <Link href="/forgot-password" className="text-xs font-600 text-primary hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-card p-6 flex flex-col items-center text-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
          <CheckCircle2 size={20} />
        </div>
        <h1 className="text-lg font-700 text-foreground">Password updated</h1>
        <p className="text-xs text-muted-foreground">
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          className="mt-1 w-full flex items-center justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-600 text-black hover:bg-primary/90 transition-colors duration-150"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-background px-3 py-2 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors duration-150 ${
      hasError ? 'border-destructive' : 'border-border'
    }`;

  return (
    <>
      <div className="bg-card border border-border rounded-xl shadow-card p-6">
        <div className="mb-6">
          <h1 className="text-lg font-700 text-foreground">Set a new password</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Choose a password with at least 8 characters.
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>
              {formError}{' '}
              {formError.toLowerCase().includes('expired') && (
                <Link href="/forgot-password" className="font-600 underline">
                  Request a new link
                </Link>
              )}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* New password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-600 text-foreground">
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                autoFocus
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                className={inputClass(!!fieldErrors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="text-[11px] text-destructive">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-600 text-foreground">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? 'confirm-error' : undefined}
              className={inputClass(!!fieldErrors.confirmPassword)}
            />
            {fieldErrors.confirmPassword && (
              <p id="confirm-error" className="text-[11px] text-destructive">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-600 text-black hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? 'Updating…' : 'Reset password'}
          </button>
        </form>
      </div>

      <Link
        href="/login"
        className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={13} />
        Back to sign in
      </Link>
    </>
  );
}
