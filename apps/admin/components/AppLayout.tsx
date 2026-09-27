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
    <div className="flex h-screen overflow-hidden bg-background print:block print:h-auto print:overflow-visible print:bg-white">
      <div className="contents print:hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((p) => !p)}
          activePath={activePath}
        />
      </div>
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out print:overflow-visible"
      >
        <div className="min-h-full px-6 py-6 lg:px-8 xl:px-10 2xl:px-12 print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}