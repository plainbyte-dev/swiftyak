'use client';

import React, { useRef, useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const FEATURES = [
  {
    icon: 'HomeIcon',
    title: 'Door-to-Door Delivery',
    description: 'We pick up from your location and deliver directly to the recipient — no middlemen, no hassle.',
  },
  {
    icon: 'GlobeAltIcon',
    title: 'Global Network',
    description: 'Connected to 50+ countries through our trusted airline and freight partner network.',
  },
  {
    icon: 'SignalIcon',
    title: 'Real-Time Tracking',
    description: 'Monitor every step of your shipment journey with live updates via web and SMS.',
  },
  {
    icon: 'ShieldCheckIcon',
    title: 'Safe Handling',
    description: 'Trained staff and protective packaging ensure your goods arrive in perfect condition.',
  },
  {
    icon: 'DocumentCheckIcon',
    title: 'Fast Customs Support',
    description: 'Our customs experts handle paperwork and clearance so your shipments never get stuck.',
  },
  {
    icon: 'CurrencyDollarIcon',
    title: 'Competitive Pricing',
    description: 'Transparent rates with no hidden fees. Volume discounts available for business accounts.',
  },
  {
    icon: 'BuildingOfficeIcon',
    title: 'Business Accounts',
    description: 'Dedicated relationship managers, monthly invoicing, and priority handling for corporate clients.',
  },
  {
    icon: 'ChatBubbleLeftRightIcon',
    title: 'Dedicated Support',
    description: 'Reach us via phone, WhatsApp, or email — our team is available 6 days a week.',
  },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="group flex gap-4 p-6 rounded-2xl border hover:border-[#172A8A]/20 hover:shadow-lg transition-all duration-[400ms] opacity-100"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E6F0',
        animation: visible ? `fadeInUp 0.6s cubic-bezier(0.23,1,0.32,1) ${index * 70}ms forwards` : 'none',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-300"
        style={{ backgroundColor: 'rgba(23, 42, 138, 0.08)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#172A8A';
          const icon = e.currentTarget.querySelector('svg') as SVGElement | null;
          if (icon) icon.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(23, 42, 138, 0.08)';
          const icon = e.currentTarget.querySelector('svg') as SVGElement | null;
          if (icon) icon.style.color = '#172A8A';
        }}
      >
        <Icon
          name={feature.icon as never}
          size={20}
          className="transition-colors duration-300"
          style={{ color: '#172A8A' }}
        />
      </div>
      <div>
        <h3 className="font-bold text-[#0D1117] text-sm mb-1.5 group-hover:text-[#172A8A] transition-colors">
          {feature.title}
        </h3>
        <p className="text-[#6B7280] text-xs leading-relaxed">
          {feature.description}
        </p>
      </div>
    </div>
  );
}

export default function WhySwiftYak() {
  return (
    <section id="about" className="py-20 sm:py-28" style={{ backgroundColor: 'rgba(238, 240, 247, 0.4)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          {/* Left: Text */}
          <div>
            <span className="text-[#EFB000] text-xs font-bold tracking-widest uppercase mb-3 block">
              Why Choose Us
            </span>
            <h2
              className="font-extrabold text-[#0D1117] tracking-tight mb-6"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.1 }}
            >
              Built for Nepal,<br />
              <span className="text-[#172A8A]">Built for the World</span>
            </h2>
            <p className="text-[#6B7280] leading-relaxed mb-8 text-base">
              SwiftYak was founded by logistics veterans who understood Nepal&apos;s unique challenges — mountainous terrain, diverse trade corridors, and the need for a truly reliable partner. We&apos;ve spent years building the infrastructure, partnerships, and expertise to serve you better.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <div
                className="flex-1 rounded-2xl border p-5 text-center"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E6F0' }}
              >
                <p className="text-3xl font-extrabold mb-1" style={{ color: '#172A8A' }}>8+</p>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>Years of Experience</p>
              </div>
              <div
                className="flex-1 rounded-2xl border p-5 text-center"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E6F0' }}
              >
                <p className="text-3xl font-extrabold mb-1" style={{ color: '#EFB000' }}>71+</p>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>Domestic Destinations</p>
              </div>
              <div
                className="flex-1 rounded-2xl border p-5 text-center"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E6F0' }}
              >
                <p className="text-3xl font-extrabold mb-1" style={{ color: '#172A8A' }}>50+</p>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>Countries Served</p>
              </div>
            </div>
          </div>

          {/* Right: Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}