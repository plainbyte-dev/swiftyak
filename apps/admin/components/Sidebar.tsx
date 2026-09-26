'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { LayoutDashboard, Package, Truck, Building2, Users, MapPin, BarChart3, Settings, ChevronLeft, ChevronRight, LogOut, Search } from 'lucide-react';
import { getMe, logout, getShipments } from '@/lib/api';
import { ApiUser } from '@/lib/types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activePath?: string;
}

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/stats-dashboard', badgeKey: null },
      { label: 'Shipments', icon: Package, href: '/shipments', badgeKey: 'shipments' as const },
      { label: 'Couriers', icon: Truck, href: '/couriers', badgeKey: null },
      { label: 'Live Tracking', icon: MapPin, href: '/tracking', badgeKey: null },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Companies', icon: Building2, href: '/companies', badgeKey: null },
      { label: 'Users', icon: Users, href: '/users', badgeKey: null },
      { label: 'Reports', icon: BarChart3, href: '/reports', badgeKey: null },
    ],
  },
];

// Role codes from the API -> friendly display labels
const ROLE_LABELS: Record<string, string> = {
  admin: 'Company Admin',
  dispatcher: 'Dispatcher',
  courier: 'Courier',
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function Sidebar({ collapsed, onToggle, activePath }: SidebarProps) {
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingShipmentCount, setPendingShipmentCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMe()
      .then((res) => {
        if (!cancelled) setUser(res.user);
      })
      .catch(() => {
        // Token missing/expired — request() already clears it on 401.
        if (!cancelled) {
          setUser(null);
          router.replace('/login');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingUser(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    // Badge shows the count of shipments that need attention (status: pending).
    // Adjust the status filter below if the badge should represent something
    // else (e.g. in_transit, or all shipments regardless of status).
    getShipments({ status: 'pending', perPage: 1 })
      .then((res) => {
        if (!cancelled) {
          // Assumes Paginated<T> exposes a `total` count of all matching
          // records server-side, not just this page's `data.length`.
          // If Paginated<T> uses a different field name (e.g. `count`,
          // `meta.total`), update the line below to match.
          const total = (res as any).total ?? res.data.length;
          setPendingShipmentCount(total);
        }
      })
      .catch(() => {
        // Non-fatal — just hide the badge if the count can't be loaded.
        if (!cancelled) setPendingShipmentCount(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogoutClick() {
    setShowLogoutConfirm(true);
  }

  function confirmLogout() {
    logout();
    router.replace('/login');
  }

  function cancelLogout() {
    setShowLogoutConfirm(false);
  }

  const initials = user ? getInitials(user.name) : '';
  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : '';

  return (
    <aside
      className="relative flex flex-col bg-card border-r border-border shrink-0 transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border h-16 overflow-hidden">
        <div className="shrink-0">
          <AppLogo size={28} />
        </div>
        {!collapsed && (
          <span className="font-bold text-base text-foreground tracking-tight whitespace-nowrap">
            CourierDesk
          </span>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-border">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors duration-150">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Search... ⌘K</span>
          </div>
        </div>
      )}

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {NAV_GROUPS.map((group) => (
          <div key={`group-${group.label}`} className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-700 uppercase tracking-widest text-muted-foreground select-none">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = activePath === item.href || (item.href === '/stats-dashboard' && activePath === '/');
                const Icon = item.icon;
                const badgeValue =
                  item.badgeKey === 'shipments' && pendingShipmentCount != null && pendingShipmentCount > 0
                    ? String(pendingShipmentCount)
                    : null;

                return (
                  <Link
                    key={`nav-${item.href}`}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {badgeValue && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-warning text-white text-[10px] font-700 px-1.5">
                            {badgeValue}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && badgeValue && (
                      <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-warning" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border px-2 py-3 flex flex-col gap-0.5">
        <Link
          href="/settings"
          className="sidebar-nav-item"
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && <span className="truncate">Settings</span>}
        </Link>

        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 mt-1 rounded-lg hover:bg-muted transition-colors duration-150">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-700 shrink-0 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                loadingUser ? '' : initials || '?'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-600 text-foreground truncate">
                {loadingUser ? 'Loading…' : user?.name ?? 'Unknown user'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {loadingUser ? '' : roleLabel}
              </p>
            </div>
            <button
              onClick={handleLogoutClick}
              aria-label="Logout"
              title="Logout"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}

        {collapsed && (
          <button onClick={handleLogoutClick} className="sidebar-nav-item justify-center" title="Logout">
            <LogOut size={18} className="shrink-0" />
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[72px] z-10 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border shadow-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
          onClick={cancelLogout}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="logout-confirm-title" className="text-base font-700 text-foreground">
              Log out?
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              You'll need to sign in again to access your account.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-sm font-600 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-600 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}