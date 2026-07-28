'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const ROUTES = [
  { from: { x: 420, y: 195 }, to: { x: 680, y: 130 }, label: 'Dubai' },
  { from: { x: 420, y: 195 }, to: { x: 360, y: 145 }, label: 'Delhi' },
  { from: { x: 420, y: 195 }, to: { x: 720, y: 80 }, label: 'London' },
  { from: { x: 420, y: 195 }, to: { x: 160, y: 145 }, label: 'New York' },
  { from: { x: 420, y: 195 }, to: { x: 820, y: 240 }, label: 'Sydney' },
  { from: { x: 420, y: 195 }, to: { x: 760, y: 155 }, label: 'Tokyo' },
  { from: { x: 420, y: 195 }, to: { x: 460, y: 150 }, label: 'Beijing' },
];

const CITY_PINS = [
  { x: 420, y: 195, label: 'Kathmandu', primary: true },
  { x: 680, y: 130, label: 'Dubai' },
  { x: 360, y: 145, label: 'Delhi' },
  { x: 720, y: 80, label: 'London' },
  { x: 160, y: 145, label: 'New York' },
  { x: 820, y: 240, label: 'Sydney' },
  { x: 760, y: 155, label: 'Tokyo' },
  { x: 460, y: 150, label: 'Beijing' },
];

// Logo navy, sampled directly from the uploaded logo file
const LOGO_NAVY = '#041938';

function WorldMapSVG() {
  return (
    <svg
      viewBox="0 0 980 320"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EFB000" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#EFB000" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker id="arrowMarker" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <circle cx="3" cy="3" r="1.5" fill="#EFB000" opacity="0.8" />
        </marker>
      </defs>

      {/* Simplified world landmass shapes */}
      {/* North America */}
      <path d="M80,60 L200,55 L230,90 L220,150 L180,170 L140,160 L100,140 L70,110 Z" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
      {/* South America */}
      <path d="M160,175 L210,170 L225,200 L215,260 L185,270 L165,250 L155,210 Z" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
      {/* Europe */}
      <path d="M680,50 L760,45 L780,75 L760,100 L720,105 L695,90 L675,70 Z" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
      {/* Africa */}
      <path d="M660,110 L720,105 L740,140 L730,200 L700,220 L665,210 L645,170 L650,130 Z" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
      {/* Middle East */}
      <path d="M660,100 L710,95 L720,120 L700,135 L665,130 Z" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
      {/* Asia */}
      <path d="M720,45 L870,40 L900,70 L880,120 L840,140 L780,145 L740,130 L720,100 Z" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
      {/* South Asia (India/Nepal region) */}
      <path d="M380,130 L460,125 L480,155 L470,200 L440,215 L400,205 L375,175 Z" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
      {/* Australia */}
      <path d="M790,210 L880,205 L900,240 L880,275 L820,280 L790,255 Z" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />

      {/* Latitude/Longitude grid lines */}
      {[60, 120, 180, 240, 300].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="320" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      ))}
      {[80, 160, 240].map((y) => (
        <line key={y} x1="0" y1={y} x2="980" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      ))}

      {/* Curved route lines */}
      {ROUTES.map((route, i) => {
        const cpx = (route.from.x + route.to.x) / 2;
        const cpy = Math.min(route.from.y, route.to.y) - 60 - i * 8;
        const d = `M ${route.from.x} ${route.from.y} Q ${cpx} ${cpy} ${route.to.x} ${route.to.y}`;
        return (
          <g key={i}>
            <path
              d={d}
              fill="none"
              stroke="rgba(239,176,0,0.15)"
              strokeWidth="1.5"
            />
            <path
              d={d}
              fill="none"
              stroke="rgba(239,176,0,0.7)"
              strokeWidth="1"
              strokeDasharray="6 8"
              filter="url(#glow)"
              style={{
                animation: `routePulse ${2 + i * 0.3}s ease-in-out ${i * 0.4}s infinite`,
              }}
            />
          </g>
        );
      })}

      {/* City pins */}
      {CITY_PINS.map((pin, i) => (
        <g key={i}>
          {pin.primary ? (
            <>
              <circle cx={pin.x} cy={pin.y} r="10" fill="rgba(239,176,0,0.15)" />
              <circle cx={pin.x} cy={pin.y} r="6" fill="rgba(239,176,0,0.3)" className="glow-dot" />
              <circle cx={pin.x} cy={pin.y} r="3.5" fill="#EFB000" filter="url(#glow)" />
            </>
          ) : (
            <>
              <circle
                cx={pin.x}
                cy={pin.y}
                r="4"
                fill="rgba(239,176,0,0.2)"
                className="glow-dot"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
              <circle cx={pin.x} cy={pin.y} r="2" fill="#EFB000" opacity="0.8" />
            </>
          )}
        </g>
      ))}
    </svg>
  );
}

function YakSVG() {
  return (
    <svg viewBox="0 0 80 50" width="80" height="50" aria-hidden="true">
      {/* Body */}
      <ellipse cx="40" cy="30" rx="22" ry="12" fill="#EFB000" />
      {/* Head */}
      <ellipse cx="60" cy="24" rx="10" ry="8" fill="#EFB000" />
      {/* Horns */}
      <path d="M56 18 Q52 10 48 14" stroke="#FFD040" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M64 18 Q68 10 72 14" stroke="#FFD040" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Eye */}
      <circle cx="63" cy="22" r="2" fill={LOGO_NAVY} />
      <circle cx="63.7" cy="21.3" r="0.6" fill="white" />
      {/* Legs */}
      <rect x="22" y="38" width="5" height="10" rx="2" fill="#D4960A" />
      <rect x="32" y="38" width="5" height="10" rx="2" fill="#D4960A" />
      <rect x="44" y="38" width="5" height="10" rx="2" fill="#D4960A" />
      <rect x="54" y="38" width="5" height="10" rx="2" fill="#D4960A" />
      {/* Tail */}
      <path d="M18 28 Q8 20 10 30 Q12 38 18 35" stroke="#EFB000" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Cargo box */}
      <rect x="28" y="16" width="18" height="14" rx="2" fill={LOGO_NAVY} />
      <rect x="31" y="19" width="12" height="8" rx="1" fill="#0A2A5C" />
      <line x1="37" y1="19" x2="37" y2="27" stroke="rgba(239,176,0,0.5)" strokeWidth="1" />
      <line x1="31" y1="23" x2="43" y2="23" stroke="rgba(239,176,0,0.5)" strokeWidth="1" />
    </svg>
  );
}

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [yakPos, setYakPos] = useState(0);
  const yakRef = useRef<number>(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    animRef.current = setInterval(() => {
      yakRef.current = (yakRef.current + 0.15) % 110;
      setYakPos(yakRef.current);
    }, 16);
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #020E22 0%, ${LOGO_NAVY} 35%, #0A2A5C 65%, #010A1A 100%)`,
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {mounted && Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/20"
            style={{
              left: `${(i * 5.3) % 100}%`,
              top: `${(i * 7.1) % 100}%`,
              animationDelay: `${i * 0.3}s`,
              animation: `floatUpDown ${3 + (i % 3)}s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* World Map */}
      <div className="absolute inset-0 opacity-60 pointer-events-none" aria-hidden="true">
        <WorldMapSVG />
      </div>

      {/* Gradient overlay bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${LOGO_NAVY}CC, transparent)` }}
        aria-hidden="true"
      />

      {/* Yak walking animation */}
      {mounted && (
        <div
          className="absolute bottom-16 pointer-events-none z-10"
          style={{ left: `${yakPos}vw`, transform: 'translateX(-50%)' }}
          aria-hidden="true"
        >
          {/* Golden trail */}
          <div
            className="absolute bottom-0 left-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#EFB000] to-transparent opacity-60"
            style={{ width: '120px', transform: 'translateX(-50%) translateX(-60px)' }}
          />
          <YakSVG />
        </div>
      )}

      {/* Floating package icons */}
      <div className="absolute top-1/4 left-8 opacity-30 float-anim pointer-events-none" aria-hidden="true">
        <div className="w-8 h-8 bg-[#EFB000]/20 rounded-lg border border-[#EFB000]/30 flex items-center justify-center">
          <Icon name="ArchiveBoxIcon" size={16} className="text-[#EFB000]" />
        </div>
      </div>
      <div className="absolute top-1/3 right-12 opacity-25 float-anim pointer-events-none" style={{ animationDelay: '1s' }} aria-hidden="true">
        <div className="w-8 h-8 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center">
          <Icon name="TruckIcon" size={16} className="text-white" />
        </div>
      </div>
      <div className="absolute bottom-1/3 left-16 opacity-20 float-anim pointer-events-none" style={{ animationDelay: '2s' }} aria-hidden="true">
        <div className="w-8 h-8 bg-[#EFB000]/15 rounded-lg border border-[#EFB000]/25 flex items-center justify-center">
          <Icon name="GlobeAltIcon" size={16} className="text-[#EFB000]" />
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <div className="max-w-4xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#EFB000] animate-glow" />
            <span className="text-white/80 text-xs font-semibold tracking-widest uppercase">
              Nepal&apos;s Premier Courier Partner
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-hero-xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Delivering{' '}
            <span className="relative inline-block">
              <span className="text-[#EFB000]">Nepal</span>
            </span>{' '}
            <br className="hidden sm:block" />
            to the{' '}
            <span className="relative">
              World.
              <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,5 Q50,0 100,4 Q150,8 200,3" stroke="#EFB000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-white/65 font-medium leading-relaxed max-w-2xl mb-10">
            Swift Yak provides reliable domestic courier, international shipping, freight forwarding, import/export logistics, and business delivery solutions with real-time tracking and professional customer support.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-14">
            <Link
              href="/tracking"
              className="inline-flex items-center justify-center gap-2.5 bg-white font-bold px-8 py-4 rounded-xl hover:bg-white/95 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl text-base"
              style={{ color: LOGO_NAVY }}
            >
              <Icon name="MagnifyingGlassIcon" size={18} />
              Track Shipment
            </Link>
            <Link
              href="/get-quote"
              className="inline-flex items-center justify-center gap-2.5 font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl text-base"
              style={{
                background: 'linear-gradient(135deg, #EFB000 0%, #FFD040 50%, #D4960A 100%)',
                color: LOGO_NAVY,
              }}
            >
              <Icon name="CalculatorIcon" size={18} />
              Get a Quote
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            {[
              { label: '50+ Countries', icon: 'GlobeAltIcon' },
              { label: '10,000+ Packages', icon: 'ArchiveBoxIcon' },
              { label: '99% On-Time', icon: 'CheckCircleIcon' },
              { label: '24/7 Support', icon: 'PhoneIcon' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <Icon name={item.icon as never} size={16} className="text-[#EFB000]" />
                <span className="text-white/70 text-sm font-semibold">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10" aria-hidden="true">
        <span className="text-white/30 text-xs font-medium tracking-widest uppercase">Scroll</span>
        <div className="w-px h-10 bg-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[#EFB000] animate-scroll-line" />
        </div>
      </div>
    </section>
  );
}