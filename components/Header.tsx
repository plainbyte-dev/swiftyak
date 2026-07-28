'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/#services' },
  { label: 'Tracking', href: '/tracking' },
  { label: 'Get Quote', href: '/get-quote' },
  { label: 'Industries', href: '/#industries' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500  ${
          scrolled ? 'glass-nav py-3 shadow-sm' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center">
              {/* Soft glow so the navy logo mark stays visible over the dark hero background */}
              {!scrolled && (
                <div
                  className="absolute -inset-2 rounded-full bg-white/25 blur-md pointer-events-none"
                  aria-hidden="true"
                />
              )}
              <AppLogo
                size={80}
                className="relative transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span
              className={`font-extrabold text-xl tracking-tight transition-colors duration-300 ${
                scrolled ? 'text-[#172A8A]' : 'text-white'
              }`}
            >
              Swift<span className="text-[#EFB000]">Yak</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks?.map((link) => (
              <Link
                key={link?.href}
                href={link?.href}
                className={`nav-link-underline text-sm font-semibold transition-colors duration-200 ${
                  scrolled
                    ? 'text-[#0D1117] hover:text-[#172A8A]'
                    : 'text-white/85 hover:text-white'
                }`}
              >
                {link?.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/tracking"
              className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
                scrolled
                  ? 'text-[#172A8A] hover:bg-[#EEF0F7]' : 'text-white/85 hover:text-white'
              }`}
            >
              Track
            </Link>
            <Link
              href="/get-quote"
              className="text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #EFB000 0%, #FFD040 50%, #D4960A 100%)',
                color: '#172A8A',
              }}
            >
              Book Shipment
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              scrolled ? 'text-[#0D1117]' : 'text-white'
            }`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <Icon name={menuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
          </button>
        </div>
      </header>
      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-lg flex flex-col pt-24 px-6 pb-8 lg:hidden">
          <nav className="flex flex-col gap-2 flex-1">
            {navLinks?.map((link) => (
              <Link
                key={link?.href}
                href={link?.href}
                onClick={() => setMenuOpen(false)}
                className="text-[#0D1117] font-semibold text-lg py-3 border-b border-[#E2E6F0] hover:text-[#172A8A] transition-colors"
              >
                {link?.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3 pt-6">
            <Link
              href="/tracking"
              onClick={() => setMenuOpen(false)}
              className="text-center border-2 border-[#172A8A] text-[#172A8A] font-bold py-3 rounded-xl hover:bg-[#EEF0F7] transition-colors"
            >
              Track Shipment
            </Link>
            <Link
              href="/get-quote"
              onClick={() => setMenuOpen(false)}
              className="text-center font-bold py-3 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #EFB000 0%, #FFD040 50%, #D4960A 100%)',
                color: '#172A8A',
              }}
            >
              Book Shipment
            </Link>
          </div>
        </div>
      )}
    </>
  );
}