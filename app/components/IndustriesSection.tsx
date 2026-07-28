'use client';

import React, { useRef, useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const INDUSTRIES = [
  { name: 'Garments & Textiles', icon: 'ScissorsIcon', color: 'bg-blue-50 text-blue-700' },
  { name: 'Handicrafts', icon: 'SparklesIcon', color: 'bg-amber-50 text-amber-700' },
  { name: 'Medical & Pharma', icon: 'HeartIcon', color: 'bg-red-50 text-red-700' },
  { name: 'Electronics', icon: 'CpuChipIcon', color: 'bg-purple-50 text-purple-700' },
  { name: 'Furniture', icon: 'HomeIcon', color: 'bg-green-50 text-green-700' },
  { name: 'Automotive', icon: 'WrenchScrewdriverIcon', color: 'bg-slate-50 text-slate-700' },
  { name: 'Retail', icon: 'ShoppingBagIcon', color: 'bg-pink-50 text-pink-700' },
  { name: 'Manufacturing', icon: 'CogIcon', color: 'bg-orange-50 text-orange-700' },
  { name: 'E-commerce', icon: 'ComputerDesktopIcon', color: 'bg-indigo-50 text-indigo-700' },
];

export default function IndustriesSection() {
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
    <section id="industries" className="py-20 sm:py-28" style={{ backgroundColor: '#F8F9FC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-[#EFB000] text-xs font-bold tracking-widest uppercase mb-3 block">
            Industries We Serve
          </span>
          <h2
            className="font-extrabold text-[#0D1117] tracking-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.1 }}
          >
            Logistics for Every<br />
            <span className="text-[#172A8A]">Industry</span>
          </h2>
          <p className="text-[#6B7280] text-base mt-4 max-w-xl mx-auto leading-relaxed">
            From mountain handicrafts to high-tech electronics — SwiftYak understands the unique logistics requirements of Nepal&apos;s key sectors.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {INDUSTRIES.map((industry, i) => (
            <div
              key={industry.name}
              className="group p-5 rounded-2xl bg-white border border-[#E2E6F0] hover:border-[#172A8A]/30 hover:shadow-[0_20px_60px_rgba(23,42,138,0.12)] hover:-translate-y-1.5 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] text-center cursor-pointer opacity-100"
              style={{
                animation: visible ? `scaleIn 0.5s cubic-bezier(0.23,1,0.32,1) ${i * 60}ms forwards` : 'none',
                opacity: visible ? 1 : 0,
              }}
            >
              <div className={`w-12 h-12 rounded-xl ${industry.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <Icon name={industry.icon as never} size={20} />
              </div>
              <p className="text-sm font-semibold text-[#0D1117] group-hover:text-[#172A8A] transition-colors leading-tight">
                {industry.name}
              </p>
            </div>
          ))}

          {/* CTA card */}
          <div
            className="group p-5 rounded-2xl border text-center cursor-pointer col-span-1 hover:shadow-[0_20px_60px_rgba(23,42,138,0.12)] hover:-translate-y-1.5 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{ backgroundColor: '#172A8A', borderColor: '#172A8A' }}
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <Icon name="PlusCircleIcon" size={20} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-white leading-tight">Your Industry</p>
            <p className="text-white/60 text-xs mt-1">Contact us</p>
          </div>
        </div>
      </div>
    </section>
  );
}