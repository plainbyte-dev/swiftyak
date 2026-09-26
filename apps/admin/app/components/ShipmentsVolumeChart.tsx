'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ShipmentVolumeChartInner = dynamic(
  () => import('./ShipmentVolumeChartInner'),
  { ssr: false, loading: () => <div className="animate-pulse bg-muted rounded-lg w-full h-[280px]" /> }
);

export default function ShipmentVolumeChart() {
  return <ShipmentVolumeChartInner />;
}