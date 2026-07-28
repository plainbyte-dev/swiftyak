import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/app/components/HeroSection';
import ServicesSection from '@/app/components/ServicesSection';
import WhySwiftYak from '@/app/components/WhySwiftYak';
import HowItWorks from '@/app/components/HowItWorks';
import StatsSection from '@/app/components/StatsSection';
import IndustriesSection from '@/app/components/IndustriesSection';
import TestimonialsSection from '@/app/components/TestimonialsSection';
import FaqSection from '@/app/components/FaqSection';
import ContactSection from '@/app/components/ContactSection';

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      <Header />
      <HeroSection />
      <ServicesSection />
      <WhySwiftYak />
      <HowItWorks />
      {/* <StatsSection /> */}
      <IndustriesSection />
      {/* <TestimonialsSection /> */}
      <FaqSection />
      <ContactSection />
      <Footer />
    </main>
  );
}