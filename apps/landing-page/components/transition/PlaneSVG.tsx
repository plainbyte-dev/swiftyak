import React from 'react';

/**
 * Flat, line-art courier plane used by the page-transition overlay.
 * Kept deliberately minimal (two-tone, no gradients/shading) so it reads
 * at a glance during a sub-second animation.
 */
export default function PlaneSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 90"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* speed lines (trail) — pure CSS animation, independent of the parent transform */}
      <g className="plane-trail">
        <path d="M2 46 H30" stroke="#EFB000" strokeWidth="2.5" strokeLinecap="round" className="plane-trail-line" style={{ animationDelay: '0ms' }} />
        <path d="M0 56 H24" stroke="#EFB000" strokeWidth="2" strokeLinecap="round" opacity="0.7" className="plane-trail-line" style={{ animationDelay: '90ms' }} />
        <path d="M6 66 H26" stroke="#EFB000" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" className="plane-trail-line" style={{ animationDelay: '170ms' }} />
      </g>

      {/* fuselage */}
      <path
        d="M34 52 H110 Q124 52 132 46 Q124 48 110 48 H34 Q28 48 28 52 Q28 56 34 56 H108 Q122 56 130 60 Q122 58 108 58 H34 Q30 58 30 54 Q30 52 34 52 Z"
        fill="#041938"
      />
      {/* main body block (simplified flat shape) */}
      <path d="M30 44 H120 Q136 44 148 52 Q136 52 120 52 H30 Q24 52 24 48 Q24 44 30 44 Z" fill="#041938" />
      <path d="M30 52 H120 Q136 52 148 52 Q136 60 120 60 H30 Q24 60 24 56 Q24 52 30 52 Z" fill="#0A2A5C" />

      {/* nose */}
      <path d="M148 52 L160 48.5 V55.5 Z" fill="#EFB000" />

      {/* cockpit window */}
      <path d="M136 47 Q142 44 148 46 L146 50 H136 Z" fill="#EFB000" opacity="0.85" />

      {/* cabin windows */}
      <circle cx="112" cy="50" r="1.6" fill="#FFD040" />
      <circle cx="102" cy="50" r="1.6" fill="#FFD040" />
      <circle cx="92" cy="50" r="1.6" fill="#FFD040" />
      <circle cx="82" cy="50" r="1.6" fill="#FFD040" />
      <circle cx="72" cy="50" r="1.6" fill="#FFD040" />
      <circle cx="62" cy="50" r="1.6" fill="#FFD040" />
      <circle cx="52" cy="50" r="1.6" fill="#FFD040" />

      {/* tail fin */}
      <path d="M32 44 L20 20 L36 44 Z" fill="#EFB000" />
      <path d="M34 60 L26 74 L40 60 Z" fill="#0A2A5C" />

      {/* wing */}
      <path d="M70 58 L48 82 L64 80 L82 60 Z" fill="#EFB000" />

      {/* propeller/engine accent under wing */}
      <rect x="58" y="62" width="14" height="6" rx="2" fill="#172A8A" />

      {/* landing gear (only meaningful while low/taxiing; harmless once airborne) */}
      <line x1="46" y1="60" x2="46" y2="68" stroke="#0D1117" strokeWidth="2" />
      <line x1="100" y1="60" x2="100" y2="68" stroke="#0D1117" strokeWidth="2" />
      <circle cx="46" cy="70" r="3" fill="#0D1117" />
      <circle cx="100" cy="70" r="3" fill="#0D1117" />
    </svg>
  );
}
