'use client';

import React, { useEffect, useState } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { getDashboardMetrics, ApiError } from '@/lib/api';

interface UtilizationSlice {
  name: string;
  value: number;
  fill: string;
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="card-elevated p-2 text-xs shadow-card-md">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.payload.fill }} />
        <span className="font-600">{item.name}:</span>
        <span className="font-tabular">{item.value}</span>
      </div>
    </div>
  );
};

function ChartSkeleton() {
  return (
    <div className="card-elevated p-5">
      <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
      <div className="h-3 w-24 bg-muted rounded animate-pulse mb-4" />
      <div className="h-[110px] w-full bg-muted rounded animate-pulse" />
    </div>
  );
}

export default function CourierUtilizationChartInner() {
  const [data, setData] = useState<UtilizationSlice[] | null>(null);
  const [totalCouriers, setTotalCouriers] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getDashboardMetrics()
      .then((res) => {
        if (cancelled) return;
        const m = res.data;
        setTotalCouriers(m.couriersAvailable + m.couriersBusy + m.couriersOffline);
        setData([
          { name: 'Busy', value: m.couriersBusy, fill: 'var(--accent)' },
          { name: 'Available', value: m.couriersAvailable, fill: 'var(--positive)' },
          { name: 'Offline', value: m.couriersOffline, fill: 'var(--muted-foreground)' },
        ]);
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

  if (errorMessage || !data) {
    return (
      <div className="card-elevated p-5">
        <h2 className="text-sm font-700 text-foreground mb-1">Courier Utilization</h2>
        <p className="text-xs text-danger">{errorMessage ?? 'No data available'}</p>
      </div>
    );
  }

  return (
    <div className="card-elevated p-5">
      <div className="mb-3">
        <h2 className="text-sm font-700 text-foreground">Courier Utilization</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{totalCouriers} total couriers</p>
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={110} height={110}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius={20}
            outerRadius={50}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'var(--muted)' }} />
            <Tooltip content={<CustomTooltip />} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 flex-1">
          {data.map((item) => (
            <div key={`util-${item.name}`} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-xs font-700 font-tabular text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
