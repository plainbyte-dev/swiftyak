'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const CourierUtilizationChartInner = dynamic(
  () => import('./CourierUtilizationChartInner'),  // was: './CourierUtilizationChart'
  { ssr: false, loading: () => <div className="animate-pulse bg-muted rounded-lg w-full h-[160px]" /> }
);

export default function CourierUtilizationChart() {
  return <CourierUtilizationChartInner />;
}