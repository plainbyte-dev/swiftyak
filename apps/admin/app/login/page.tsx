'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { login, ApiError } from '@/lib/api';

interface FormState {
  email: string;
  password: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!form.password) {
    errors.password = 'Password is required';
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return errors;
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear the field-level error as soon as the user starts fixing it.
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (formError) setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await login({ email: form.email.trim().toLowerCase(), password: form.password });
      router.replace('/stats-dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 400) {
          setFormError('Incorrect email or password.');
        } else if (err.status === 429) {
          setFormError('Too many attempts. Please wait a moment and try again.');
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
          <div className="mb-6">
            <h1 className="text-lg font-700 text-foreground">Sign in</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Enter your credentials to access your dashboard.
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
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-600 text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors duration-150 ${
                  fieldErrors.email ? 'border-destructive' : 'border-border'
                }`}
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-[11px] text-destructive">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-600 text-foreground">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[11px] text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={`w-full rounded-lg border bg-background px-3 py-2 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors duration-150 ${
                    fieldErrors.password ? 'border-destructive' : 'border-border'
                  }`}
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

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-600 text-black hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}