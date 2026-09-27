'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface FloatingMenuProps {
  /** The button that opened the menu; the menu is aligned to its right edge. */
  anchor: HTMLElement | null;
  onClose: () => void;
  children: React.ReactNode;
}

const GAP = 4;

/**
 * Row-action dropdown rendered into document.body with fixed positioning, so a table's
 * `overflow` can't clip it. Opens below the anchor, or above it when there isn't room.
 */
export default function FloatingMenu({ anchor, onClose, children }: FloatingMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Position before paint by writing styles directly (no extra render needed).
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!anchor || !menu) return;
    const place = () => {
      const a = anchor.getBoundingClientRect();
      const h = menu.offsetHeight;
      const fitsBelow = a.bottom + GAP + h <= window.innerHeight - 8;
      const top = fitsBelow || a.top - GAP - h < 8 ? a.bottom + GAP : a.top - GAP - h;
      menu.style.top = `${Math.round(top)}px`;
      menu.style.right = `${Math.round(window.innerWidth - a.right)}px`;
      menu.style.visibility = 'visible';
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [anchor]);

  // A fixed menu would drift away from its row on scroll, so close it instead.
  useEffect(() => {
    if (!anchor) return;
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [anchor, onClose]);

  if (!anchor) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        role="menu"
        style={{ position: 'fixed', top: 0, right: 0, visibility: 'hidden' }}
        className="z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px]"
      >
        {children}
      </div>
    </>,
    document.body
  );
}
