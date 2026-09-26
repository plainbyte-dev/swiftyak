'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const DeliveryOutcomeChartInner = dynamic(
  () => import('./DeliveryOutcomeChartInner'),
  { ssr: false, loading: () => <div className="animate-pulse bg-muted rounded-lg w-full h-[220px]" /> }
);

export default function DeliveryOutcomeChart() {
  return <DeliveryOutcomeChartInner />;
}