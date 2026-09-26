'use client';

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getShipments, ApiError } from '@/lib/api';
import type { ShipmentStatus } from '@/components/ui/StatusBadge';

interface StatusSlice {
  name: string;
  value: number;
  color: string;
}

const STATUS_QUERY: Array<{ status: ShipmentStatus; name: string; color: string }> = [
  { status: 'delivered', name: 'Delivered', color: 'var(--positive)' },
  { status: 'in_transit', name: 'In Transit', color: 'var(--primary)' },
  { status: 'picked_up', name: 'Picked Up', color: 'var(--info)' },
  { status: 'assigned', name: 'Assigned', color: 'var(--info)' },
  { status: 'pending', name: 'Pending', color: 'var(--accent)' },
  { status: 'failed', name: 'Failed', color: 'var(--danger)' },
  { status: 'cancelled', name: 'Cancelled', color: 'var(--muted-foreground)' },
];

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="card-elevated p-3 text-xs shadow-card-md">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: item.payload.color }} />
        <span className="font-600 text-foreground">{item.name}</span>
      </div>
      <p className="text-muted-foreground font-tabular">{item.value} shipments</p>
    </div>
  );
};

function ChartSkeleton() {
  return (
    <div className="card-elevated p-5">
      <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
      <div className="h-3 w-24 bg-muted rounded animate-pulse mb-4" />
      <div className="h-[180px] w-full bg-muted rounded animate-pulse" />
    </div>
  );
}

export default function DeliveryOutcomeChartInner() {
  const [data, setData] = useState<StatusSlice[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      STATUS_QUERY.map(({ status }) => getShipments({ status, perPage: 1 }))
    )
      .then((results) => {
        if (cancelled) return;
        const slices = STATUS_QUERY
          .map(({ name, color }, i) => ({ name, color, value: results[i].pagination.total }))
          .filter((slice) => slice.value > 0);
        setData(slices);
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

  if (loading) return <ChartSkeleton />;

  if (errorMessage || !data || data.length === 0) {
    return (
      <div className="card-elevated p-5">
        <h2 className="text-sm font-700 text-foreground mb-1">Status Distribution</h2>
        <p className="text-xs text-danger">{errorMessage ?? 'No shipments yet'}</p>
      </div>
    );
  }

  return (
    <div className="card-elevated p-5">
      <div className="mb-3">
        <h2 className="text-sm font-700 text-foreground">Status Distribution</h2>
        <p className="text-xs text-muted-foreground mt-0.5">All shipments</p>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
            formatter={(v) => <span className="text-muted-foreground">{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
