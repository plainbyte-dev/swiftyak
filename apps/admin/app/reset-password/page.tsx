import { Suspense } from 'react';
import AppLogo from '@/components/ui/AppLogo';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <AppLogo size={36} />
          <span className="font-bold text-lg text-foreground tracking-tight">CourierDesk</span>
        </div>

        {/* useSearchParams (for the token) must sit under a Suspense boundary */}
        <Suspense fallback={<div className="h-72 bg-card border border-border rounded-xl shadow-card" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
