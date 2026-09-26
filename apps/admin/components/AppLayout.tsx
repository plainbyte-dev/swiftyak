'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { isAuthenticated } from '@/lib/api';

interface AppLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

export default function AppLayout({ children, activePath }: AppLayoutProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    // The token only exists in localStorage, so this check can only run client-side
    // after mount — there is no way to gate the initial server render on it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecked(true);
  }, [router]);

  if (!checked) {
    return <div className="h-screen bg-background" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
        activePath={activePath}
      />
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out"
      >
        <div className="min-h-full px-6 py-6 lg:px-8 xl:px-10 2xl:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}