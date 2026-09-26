import React from 'react';
import AppLayout from '@/components/AppLayout';
import MetricsBentoGrid from './components/MetricsBentoGrid';
import ShipmentVolumeChart from './components/ShipmentsVolumeChart';
import DeliveryOutcomeChart from './components/DeliveryOutcomeChart';
import CourierUtilizationChart from './components/CourierUtilizationChart';
import RecentShipmentsTable from './components/RecentShipmentsTable';
import DashboardHeader from './components/DashboardHeader';
import CourierStatusPanel from './components/CourierStatusPanel';

export default function StatsDashboardPage() {
  return (
    <AppLayout activePath="/stats-dashboard">
      <div className="max-w-screen-2xl mx-auto space-y-6">
        <DashboardHeader />
        <MetricsBentoGrid />
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
          <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-2">
            <ShipmentVolumeChart />
          </div>
          <div className="lg:col-span-1 xl:col-span-1 2xl:col-span-1">
            <CourierStatusPanel />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
          <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-2">
            <RecentShipmentsTable />
          </div>
          <div className="lg:col-span-1 xl:col-span-1 2xl:col-span-1 flex flex-col gap-6">
            <DeliveryOutcomeChart />
            <CourierUtilizationChart />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}