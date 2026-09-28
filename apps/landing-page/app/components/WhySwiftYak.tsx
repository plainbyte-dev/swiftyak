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
    title: 'Global Reach',
    description: 'International shipments are delivered through our trusted logistics partner network.',
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
    title: 'Customs Support',
    description: 'For international shipments, our logistics partner manages customs documentation and clearance.',
  },
  {
    icon: 'CurrencyDollarIcon',
    title: 'Competitive Pricing',
    description: 'Transparent rates with no hidden fees. Volume discounts available for business accounts.',
  },
  // {
  //   icon: 'BuildingOfficeIcon',
  //   title: 'Business Accounts',
  //   description: 'Dedicated relationship managers, monthly invoicing, and priority handling for corporate clients.',
  // },
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
      className="group flex gap-4 p-6 rounded-2xl border border-white/15 bg-[#0D1117]/45 backdrop-blur-md hover:border-[#EFB000]/50 hover:bg-[#0D1117]/60 hover:shadow-[0_8px_30px_-8px_rgba(239,176,0,0.35)] transition-all duration-[400ms] opacity-100"
      style={{
        animation: visible ? `fadeInUp 0.6s cubic-bezier(0.23,1,0.32,1) ${index * 70}ms forwards` : 'none',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-300"
        style={{ backgroundColor: 'rgba(239, 176, 0, 0.15)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#EFB000';
          const icon = e.currentTarget.querySelector('svg') as SVGElement | null;
          if (icon) icon.style.color = '#0D1117';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(239, 176, 0, 0.15)';
          const icon = e.currentTarget.querySelector('svg') as SVGElement | null;
          if (icon) icon.style.color = '#EFB000';
        }}
      >
        <Icon
          name={feature.icon as never}
          size={20}
          className="transition-colors duration-300"
          style={{ color: '#EFB000' }}
        />
      </div>
      <div>
        <h3 className="font-bold text-white text-sm mb-1.5 group-hover:text-[#EFB000] transition-colors">
          {feature.title}
        </h3>
        <p className="text-white/70 text-xs leading-relaxed">
          {feature.description}
        </p>
      </div>
    </div>
  );
}

export default function WhySwiftYak() {
  return (
    <section id="about" className="relative isolate py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: '#0D1117' }}>
      {/* Background photo with a dark shade on top so the text stays readable */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/images/why-swiftyak-bg.webp')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: [
            'linear-gradient(180deg, rgba(13,17,23,0.6) 0%, rgba(13,17,23,0) 22%, rgba(13,17,23,0) 78%, rgba(13,17,23,0.6) 100%)',
            'linear-gradient(90deg, rgba(13,17,23,0.86) 0%, rgba(13,17,23,0.74) 50%, rgba(13,17,23,0.58) 100%)',
          ].join(', '),
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          {/* Left: Text */}
          <div>
            <span className="text-[#EFB000] text-xs font-bold tracking-widest uppercase mb-3 block">
              Why Choose Us
            </span>
            <h2
              className="font-extrabold text-white tracking-tight mb-6"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.1 }}
            >
              Built for Nepal,<br />
              <span className="text-[#EFB000]">Built for the World</span>
            </h2>
            <p className="text-white/80 leading-relaxed mb-8 text-base">
              SwiftYak was founded in 2026 to make reliable courier service simple in Nepal. Rather than build parallel freight and customs infrastructure, we work with established logistics partners for domestic and international delivery — pairing trusted networks with SwiftYak&apos;s booking, tracking, and support.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 rounded-2xl border border-white/15 bg-[#0D1117]/45 backdrop-blur-md p-5 text-center">
                <p className="text-lg font-extrabold mb-1" style={{ color: '#EFB000' }}>Domestic Delivery</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Across Nepal</p>
              </div>
              <div className="flex-1 rounded-2xl border border-white/15 bg-[#0D1117]/45 backdrop-blur-md p-5 text-center">
                <p className="text-lg font-extrabold mb-1" style={{ color: '#EFB000' }}>International Delivery</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Worldwide</p>
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