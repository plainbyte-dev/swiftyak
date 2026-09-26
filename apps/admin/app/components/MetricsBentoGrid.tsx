'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { getDashboardMetrics, ApiError } from '@/lib/api';
import type { DashboardMetrics } from '@/lib/types';

// Bento grid plan:
// 7 cards → grid-cols-4
// Row 1: [On-Time Rate hero — col-span-2] [Shipment Volume] [Active Couriers]
// Row 2: [Avg Delivery Time] [In-Transit] [Failed Rate] [Pending Assignment — alert]

function formatMinutes(mins: number | null) {
  if (mins === null) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

function buildMetrics(m: DashboardMetrics) {
  const totalCouriers = m.couriersAvailable + m.couriersBusy + m.couriersOffline;
  const utilization = totalCouriers > 0 ? Math.round((m.couriersBusy / totalCouriers) * 100) : 0;

  return [
    {
      id: 'metric-ontime',
      label: 'On-Time Delivery Rate',
      value: m.onTimeDeliveryRate !== null ? `${m.onTimeDeliveryRate}%` : '—',
      change: m.onTimeDeliveryRate !== null ? (m.onTimeDeliveryRate >= 90 ? 'On target' : 'Below target') : 'No data yet',
      changeDir: m.onTimeDeliveryRate === null ? 'neutral' as const : m.onTimeDeliveryRate >= 90 ? 'up' as const : 'down' as const,
      changeLabel: 'trailing 7 days',
      icon: CheckCircle2,
      iconBg: 'bg-positive-bg',
      iconColor: 'text-positive',
      hero: true,
      colSpan: 'col-span-2 md:col-span-2',
      context: 'SLA target: 90.0%',
      contextColor: 'text-positive',
      accent: 'border-l-4 border-l-positive',
    },
    {
      id: 'metric-volume',
      label: 'Shipments Today',
      value: String(m.shipmentsToday),
      change: signed(m.shipmentsTodayDelta),
      changeDir: m.shipmentsTodayDelta >= 0 ? 'up' as const : 'down' as const,
      changeLabel: 'vs yesterday',
      icon: Package,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      hero: false,
      colSpan: 'col-span-1',
      context: '',
      contextColor: 'text-muted-foreground',
      accent: '',
    },
    {
      id: 'metric-couriers',
      label: 'Active Couriers',
      value: String(m.activeCouriers),
      change: `${m.couriersAvailable} available`,
      changeDir: 'neutral' as const,
      changeLabel: `${m.couriersBusy} busy · ${m.couriersOffline} offline`,
      icon: Truck,
      iconBg: 'bg-info-bg',
      iconColor: 'text-info',
      hero: false,
      colSpan: 'col-span-1',
      context: `${utilization}% utilization`,
      contextColor: 'text-info',
      accent: '',
    },
    {
      id: 'metric-avgtime',
      label: 'Avg Delivery Time',
      value: formatMinutes(m.avgDeliveryTimeMinutes),
      change: '',
      changeDir: 'neutral' as const,
      changeLabel: 'across delivered shipments',
      icon: Clock,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      hero: false,
      colSpan: 'col-span-1',
      context: 'SLA target: 4h 00m',
      contextColor: 'text-positive',
      accent: '',
    },
    {
      id: 'metric-intransit',
      label: 'In Transit Now',
      value: String(m.inTransitNow),
      change: '',
      changeDir: 'neutral' as const,
      changeLabel: 'right now',
      icon: ArrowRight,
      iconBg: 'bg-info-bg',
      iconColor: 'text-info',
      hero: false,
      colSpan: 'col-span-1',
      context: '',
      contextColor: 'text-muted-foreground',
      accent: '',
    },
    {
      id: 'metric-failed',
      label: 'Failed Deliveries',
      value: String(m.failedDeliveriesToday),
      change: signed(m.failedDeliveriesDelta),
      changeDir: m.failedDeliveriesDelta > 0 ? 'down' as const : 'up' as const,
      changeLabel: 'vs yesterday',
      icon: XCircle,
      iconBg: 'bg-danger-bg',
      iconColor: 'text-danger',
      hero: false,
      colSpan: 'col-span-1',
      context: '',
      contextColor: 'text-danger',
      accent: '',
    },
    {
      id: 'metric-pending',
      label: 'Pending Assignment',
      value: String(m.pendingAssignment),
      change: m.pendingAssignment > 0 ? 'Needs action' : 'All clear',
      changeDir: m.pendingAssignment > 0 ? 'alert' as const : 'up' as const,
      changeLabel: m.pendingAssignment > 0 ? 'No courier assigned' : '',
      icon: AlertTriangle,
      iconBg: 'bg-warning-bg',
      iconColor: 'text-warning',
      hero: false,
      colSpan: 'col-span-1',
      context: m.oldestPendingMinutes !== null ? `Oldest: ${m.oldestPendingMinutes} min ago` : '',
      contextColor: 'text-warning',
      accent: m.pendingAssignment > 0 ? 'border-l-4 border-l-warning' : '',
      alert: m.pendingAssignment > 0,
    },
  ];
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className={`card-elevated p-5 animate-pulse ${i === 0 ? 'col-span-2 md:col-span-2' : 'col-span-1'}`}
        >
          <div className="h-3 w-2/3 bg-muted rounded mb-4" />
          <div className="h-7 w-1/2 bg-muted rounded mb-2" />
          <div className="h-3 w-1/3 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export default function MetricsBentoGrid() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getDashboardMetrics()
      .then((res) => {
        if (!cancelled) setMetrics(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(err instanceof ApiError ? err.message : 'Could not reach the CourierDesk API');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <MetricsSkeleton />;
  }

  if (errorMessage || !metrics) {
    return (
      <div className="card-elevated p-5 border-l-4 border-l-danger bg-danger-bg/20">
        <p className="text-sm font-600 text-danger">Couldn&apos;t load dashboard metrics</p>
        <p className="text-xs text-muted-foreground mt-1">{errorMessage}</p>
      </div>
    );
  }

  const METRICS = buildMetrics(metrics);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {METRICS.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.id}
            className={`card-elevated card-hover p-5 ${metric.colSpan} ${metric.accent} ${
              metric.alert ? 'bg-warning-bg/30' : ''
            } ${metric.hero ? 'bg-positive-bg/20' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-600 text-muted-foreground uppercase tracking-wide leading-tight">
                {metric.label}
              </p>
              <div className={`h-9 w-9 rounded-lg ${metric.iconBg} flex items-center justify-center shrink-0`}>
                <Icon size={18} className={metric.iconColor} />
              </div>
            </div>

            <div className={`font-tabular mb-1 ${metric.hero ? 'text-hero-metric' : 'text-metric-md'} text-foreground`}>
              {metric.value}
            </div>

            {(metric.change || metric.changeLabel) && (
              <div className="flex items-center gap-1 mb-1">
                {metric.changeDir === 'up' && (
                  <TrendingUp size={12} className="text-positive shrink-0" />
                )}
                {metric.changeDir === 'down' && (
                  <TrendingDown size={12} className="text-danger shrink-0" />
                )}
                {metric.changeDir === 'alert' && (
                  <AlertTriangle size={12} className="text-warning shrink-0" />
                )}
                {metric.change && (
                  <span
                    className={`text-xs font-600 ${
                      metric.changeDir === 'up' ? 'text-positive'
                        : metric.changeDir === 'down' ? 'text-danger'
                        : metric.changeDir === 'alert' ? 'text-warning' : 'text-muted-foreground'
                    }`}
                  >
                    {metric.change}
                  </span>
                )}
                {metric.changeLabel && (
                  <span className="text-xs text-muted-foreground">{metric.changeLabel}</span>
                )}
              </div>
            )}

            {metric.context && (
              <p className={`text-xs font-500 ${metric.contextColor}`}>{metric.context}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}