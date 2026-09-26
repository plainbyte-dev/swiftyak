'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Clock, AlertCircle } from 'lucide-react';
import { CourierStatusBadge } from '@/components/ui/StatusBadge';
import { getCouriers, ApiError } from '@/lib/api';
import type { ApiCourier } from '@/lib/types';

function minutesAgo(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function formatAgo(mins: number) {
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ago`;
}

function CourierStatusSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 flex-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`skeleton-${i}`} className="rounded-lg border border-border p-3 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-3 w-2/3 bg-muted rounded" />
              <div className="h-2.5 w-1/2 bg-muted rounded" />
              <div className="h-2.5 w-1/3 bg-muted rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CourierStatusPanel() {
  const [couriers, setCouriers] = useState<ApiCourier[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCouriers()
      .then((res) => {
        if (!cancelled) setCouriers(res.data);
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

  return (
    <div className="card-elevated p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-700 text-foreground">Courier Status</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? 'Live · loading…' : `Live · ${couriers.length} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-positive pulse-dot" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </div>

      {loading ? (
        <CourierStatusSkeleton />
      ) : errorMessage ? (
        <p className="text-xs text-danger">{errorMessage}</p>
      ) : (
        <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto">
          {couriers.map((courier) => {
            const lastPingMinutes = minutesAgo(courier.lastPingAt);
            return (
              <div
                key={courier._id}
                className={`rounded-lg border p-3 transition-all duration-150 hover:shadow-card cursor-pointer ${
                  courier.status === 'offline' ? 'border-border bg-muted/30 opacity-70'
                    : courier.status === 'available' ? 'border-positive/30 bg-positive-bg/30' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-700">
                      {courier.initials}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        courier.status === 'available' ? 'bg-positive'
                          : courier.status === 'busy' ? 'bg-warning' : 'bg-muted-foreground'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-600 text-foreground truncate">{courier.name}</p>
                      <CourierStatusBadge status={courier.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-muted-foreground shrink-0" />
                      <p className="text-[10px] text-muted-foreground truncate">{courier.location}</p>
                    </div>
                    {courier.currentShipment && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-info font-600">{courier.currentShipment}</span>
                        <span className="text-[10px] text-muted-foreground">· {courier.deliveriesLeft} left</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-muted-foreground shrink-0" />
                      <span className="text-[10px] text-muted-foreground">{formatAgo(lastPingMinutes)}</span>
                      {courier.status === 'offline' && lastPingMinutes > 30 && (
                        <AlertCircle size={10} className="text-danger ml-1" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="mt-3 w-full btn-secondary text-xs py-2">
        View All Couriers →
      </button>
    </div>
  );
}