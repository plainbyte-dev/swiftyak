'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import PlaneSVG from './PlaneSVG';

const NAVY = '#041938';

// Timeline (ms) — slow enough that the taxi → climb → exit arc actually reads,
// not just a flicker.
const SWAP_MS = 750; // when the new page content is swapped in behind the still-opaque overlay
const TOTAL_MS = 1500; // when the overlay is fully gone and interaction is unblocked
const UNBLOCK_MS = Math.round(TOTAL_MS * 0.82); // overlay starts fading here — stop eating clicks from this point on

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const childrenRef = useRef(children);
  useEffect(() => {
    childrenRef.current = children;
  });

  const [displayChildren, setDisplayChildren] = useState(children);
  const [revealKey, setRevealKey] = useState(0);
  const [flying, setFlying] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const prevPathnameRef = useRef(pathname);
  const isAnimatingRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (pathname === prevPathnameRef.current) return;
    prevPathnameRef.current = pathname;

    if (prefersReducedMotion) {
      setDisplayChildren(childrenRef.current);
      setRevealKey((k) => k + 1);
      return;
    }

    // Rapid repeat navigation: let the in-flight cycle finish and land on
    // whatever the latest pathname turns out to be — don't stack overlays.
    if (isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    setFlying(true);
    setBlocking(true);

    const swapTimer = window.setTimeout(() => {
      setDisplayChildren(childrenRef.current);
      setRevealKey((k) => k + 1);
    }, SWAP_MS);

    const unblockTimer = window.setTimeout(() => {
      setBlocking(false);
    }, UNBLOCK_MS);

    const endTimer = window.setTimeout(() => {
      setFlying(false);
      isAnimatingRef.current = false;
    }, TOTAL_MS);

    timersRef.current.push(swapTimer, unblockTimer, endTimer);

    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, [pathname, prefersReducedMotion]);

  return (
    <>
      <motion.div
        key={revealKey}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.15 : 0.5, ease: 'easeOut' }}
      >
        {displayChildren}
      </motion.div>

      <AnimatePresence>
        {flying && !prefersReducedMotion && (
          <motion.div
            className="fixed inset-0 z-999 overflow-hidden"
            style={{ backgroundColor: NAVY, pointerEvents: blocking ? 'auto' : 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: TOTAL_MS / 1000, times: [0, 0.06, 0.82, 1], ease: 'easeInOut' }}
            aria-hidden="true"
          >
            {/* x/y below are the plane's CENTER point in viewport units — the inner
                wrapper's static -50%/-50% translate re-anchors the SVG's top-left
                origin to its middle so the path reads as "where the plane visually is". */}
            <motion.div
              className="absolute left-0 top-0"
              initial={{ x: '-20vw', y: '80vh', rotate: 0 }}
              animate={{
                x: ['-20vw', '6vw', '32vw', '52vw', '80vw', '120vw'],
                y: ['80vh', '80vh', '62vh', '42vh', '16vh', '-28vh'],
                rotate: [0, 0, -8, -14, -20, -24],
              }}
              transition={{
                duration: TOTAL_MS / 1000,
                times: [0, 0.15, 0.38, 0.55, 0.75, 1],
                ease: 'easeIn',
              }}
            >
              <div style={{ transform: 'translate(-50%, -50%)', width: 'clamp(180px, 22vw, 340px)' }}>
                <PlaneSVG className="w-full h-auto drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .plane-trail-line {
          transform-origin: right center;
          animation: planeTrailPulse 0.5s ease-in-out infinite;
        }
        @keyframes planeTrailPulse {
          0% {
            opacity: 0.15;
            transform: scaleX(0.6);
          }
          50% {
            opacity: 0.9;
            transform: scaleX(1);
          }
          100% {
            opacity: 0.15;
            transform: scaleX(0.6);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .plane-trail-line {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
