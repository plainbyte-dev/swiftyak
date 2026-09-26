import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrackingInterface from '@/app/tracking/components/TrackingInterface';

export const metadata = {
  title: 'Track Your Shipment — SwiftYak',
  description: 'Track your SwiftYak shipment in real-time. Enter your tracking number to see the current status, location, and estimated delivery.',
};

export default function TrackingPage() {
  return (
    <main>
      <Header />
      <TrackingInterface />
      <Footer />
    </main>
  );
}