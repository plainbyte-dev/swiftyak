'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getVolumeTrend, ApiError } from '@/lib/api';
import type { VolumeDataPoint } from '@/lib/types';

type TabType = 'volume' | 'ontime';

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-elevated p-3 text-xs shadow-card-md min-w-[160px]">
      <p className="font-600 text-foreground mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={`tooltip-entry-${i}`} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground capitalize">{entry.name}</span>
          </div>
          <span className="font-600 text-foreground font-tabular">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

function ChartSkeleton() {
  return (
    <div className="card-elevated p-5 h-full">
      <div className="h-4 w-40 bg-muted rounded animate-pulse mb-2" />
      <div className="h-3 w-28 bg-muted rounded animate-pulse mb-4" />
      <div className="h-[220px] w-full bg-muted rounded animate-pulse" />
    </div>
  );
}

export default function ShipmentVolumeChartInner() {
  const [activeTab, setActiveTab] = useState<TabType>('volume');
  const [data, setData] = useState<VolumeDataPoint[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getVolumeTrend('week')
      .then((res) => {
        if (!cancelled) setData(res.data);
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
      <div className="card-elevated p-5 h-full">
        <h2 className="text-base font-700 text-foreground mb-1">Shipment Volume</h2>
        <p className="text-xs text-danger">{errorMessage ?? 'No data available'}</p>
      </div>
    );
  }

  const half = Math.floor(data.length / 2);
  const totalThisWeek = data.slice(half).reduce((s, d) => s + d.shipments, 0);
  const totalLastWeek = data.slice(0, half).reduce((s, d) => s + d.shipments, 0);
  const weekChange = totalThisWeek - totalLastWeek;
  const weekChangeDir = weekChange >= 0 ? 'up' : 'down';

  return (
    <div className="card-elevated p-5 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-700 text-foreground">Shipment Volume</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Trailing trend</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {weekChangeDir === 'up' ? (
              <TrendingUp size={13} className="text-positive" />
            ) : (
              <TrendingDown size={13} className="text-danger" />
            )}
            <span className={`text-xs font-600 ${weekChangeDir === 'up' ? 'text-positive' : 'text-danger'}`}>
              {weekChange > 0 ? '+' : ''}{weekChange} this week
            </span>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['volume', 'ontime'] as TabType[]).map((tab) => (
              <button
                key={`chart-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-600 transition-colors duration-150 ${
                  activeTab === tab
                    ? 'bg-primary text-white' :'bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab === 'volume' ? 'Volume' : 'Delivered vs Failed'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'volume' ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="shipmentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="shipments"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#shipmentGradient)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--card)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(v) => <span className="text-muted-foreground capitalize">{v}</span>}
            />
            <Bar dataKey="delivered" name="Delivered" fill="var(--positive)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="failed" name="Failed" fill="var(--danger)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
