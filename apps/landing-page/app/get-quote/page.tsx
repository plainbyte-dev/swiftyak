import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QuoteCalculator from '@/app/get-quote/components/QuoteCalculator';

export const metadata = {
  title: 'Get a Shipping Quote — SwiftYak',
  description: 'Calculate instant shipping rates for domestic and international shipments from Nepal. Get pricing for air freight, sea freight, and courier services.',
};

export default function GetQuotePage() {
  return (
    <main>
      <Header />
      <QuoteCalculator />
      <Footer />
    </main>
  );
}