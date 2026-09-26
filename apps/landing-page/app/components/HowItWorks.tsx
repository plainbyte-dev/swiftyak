'use client';

import React, { useRef, useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const STEPS = [
  {
    number: '01',
    icon: 'CalculatorIcon',
    title: 'Request Quote',
    description: 'Fill in your shipment details online or call us for an instant price estimate.',
  },
  {
    number: '02',
    icon: 'CalendarDaysIcon',
    title: 'Schedule Pickup',
    description: 'Choose a convenient pickup time. Our courier arrives at your doorstep.',
  },
  {
    number: '03',
    icon: 'ArchiveBoxArrowDownIcon',
    title: 'Shipment Collected',
    description: 'We securely pack and label your items, then log them into our tracking system.',
  },
  {
    number: '04',
    icon: 'TruckIcon',
    title: 'In Transit',
    description: 'Your shipment moves through our network with live tracking at every checkpoint.',
  },
  {
    number: '05',
    icon: 'DocumentCheckIcon',
    title: 'Customs Clearance',
    description: 'For international shipments, our logistics partner handles customs documentation and clearance.',
  },
  {
    number: '06',
    icon: 'CheckCircleIcon',
    title: 'Delivered',
    description: 'Your shipment arrives at its destination on time, with proof of delivery confirmation.',
  },
];

// Hardcoded from globals.css / logo so this component never depends on @theme token mapping
const NAVY = '#172A8A';
const GOLD = '#EFB000';
const NEAR_BLACK = '#0D1117';
const ORANGE = '#E8590C'; // sampled from the logo's speed lines

// Three tapering lines echoing the motion streaks trailing the bull in the logo
function SpeedLines({ active }: { active: boolean }) {
  const lines = [
    { width: 22, top: -10, opacity: 0.9 },
    { width: 16, top: -3, opacity: 0.65 },
    { width: 10, top: 4, opacity: 0.4 },
  ];
  return (
    <div
      className="absolute -left-7 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-700"
      style={{ opacity: active ? 1 : 0 }}
      aria-hidden="true"
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className="h-[2px] rounded-full mb-1 transition-all duration-700 ease-out"
          style={{
            width: active ? line.width : 0,
            marginTop: line.top,
            backgroundColor: ORANGE,
            opacity: line.opacity,
            transitionDelay: `${i * 90}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-28 overflow-hidden"
      style={{ backgroundColor: NEAR_BLACK }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="text-xs font-bold tracking-widest uppercase mb-3 block"
            style={{ color: GOLD }}
          >
            Simple Process
          </span>
          <h2 className="text-section-title font-extrabold text-white tracking-tight">
            How It <span style={{ color: GOLD }}>Works</span>
          </h2>
          <p className="text-white/50 text-base mt-4 max-w-xl mx-auto leading-relaxed">
            From quote to delivery in 6 seamless steps. Transparent, trackable, and reliable every time.
          </p>
        </div>

        {/* Steps */}
        <div ref={sectionRef} className="relative">
          {/* Desktop progress line */}
          <div className="hidden lg:block absolute top-10 left-0 right-0 h-0.5 bg-white/10 mx-16 overflow-visible">
            <div
              className="relative h-full transition-all duration-[1500ms] ease-out"
              style={{ width: isVisible ? '100%' : '0%', backgroundColor: GOLD }}
            >
              {/* Traveling orange highlight at the leading edge, echoing the logo's motion streaks */}
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-opacity duration-500"
                style={{
                  backgroundColor: ORANGE,
                  boxShadow: `0 0 10px 2px ${ORANGE}99`,
                  opacity: isVisible ? 1 : 0,
                  transitionDelay: '1400ms',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-4">
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className="flex flex-col items-center text-center gap-4 transition-all duration-500 ease-out"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
                  transitionDelay: `${i * 120}ms`,
                }}
              >
                {/* Icon circle */}
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center border-2 shadow-lg z-10"
                  style={{ backgroundColor: GOLD, borderColor: GOLD, color: NAVY }}
                >
                  <SpeedLines active={isVisible} />
                  <Icon name={step.icon as never} size={26} />
                  {/* Step number */}
                  <span
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
                    style={{ backgroundColor: NAVY }}
                  >
                    {step.number}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm mb-1.5">{step.title}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <a
            href="/get-quote"
            className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl text-base"
            style={{
              background: `linear-gradient(135deg, ${GOLD} 0%, #FFD040 50%, #D4960A 100%)`,
              color: NAVY,
            }}
          >
            <Icon name="RocketLaunchIcon" size={18} />
            Start Your Shipment
          </a>
        </div>
      </div>
    </section>
  );
}