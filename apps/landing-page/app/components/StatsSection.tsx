'use client';

import React, { useRef, useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

// Do not add unverified figures here. Use partner-attributed, non-numeric
// claims until real, confirmed numbers exist for SwiftYak and its delivery partners.
const STATS: { value: number; suffix: string; label: string; icon: string; description: string }[] = [];

function CounterNumber({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const duration = 1800;
          const increment = target / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  if (STATS.length === 0) return null;

  return (
    <section className="py-20 sm:py-24 bg-[#041938] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/3" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-white/5" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <span className="text-[#EFB000] text-xs font-bold tracking-widest uppercase mb-3 block">
            Numbers That Matter
          </span>
          <h2 className="text-section-title font-extrabold text-white tracking-tight">
            Trusted by Thousands
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 sm:p-8 rounded-2xl bg-white/6 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#EFB000]/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#EFB000]/30 transition-colors">
                <Icon name={stat.icon as never} size={22} className="text-[#EFB000]" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
                <CounterNumber target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-white/80 font-semibold text-sm mb-1">{stat.label}</p>
              <p className="text-white/35 text-xs">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}