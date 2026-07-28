import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

const footerLinks = [
  {
    group: 'Company',
    links: [
      { label: 'About Us', href: '/#about' },
      { label: 'Careers', href: '#' },
      { label: 'News', href: '#' },
    ],
  },
  {
    group: 'Services',
    links: [
      { label: 'Domestic Courier', href: '/#services' },
      { label: 'International Shipping', href: '/#services' },
      { label: 'Air Freight', href: '/#services' },
      { label: 'Sea Freight', href: '/#services' },
    ],
  },
  {
    group: 'Resources',
    links: [
      { label: 'Track Shipment', href: '/tracking' },
      { label: 'Get a Quote', href: '/get-quote' },
      { label: 'FAQs', href: '/#faq' },
      { label: 'Contact', href: '/#contact' },
    ],
  },
];

const socialLinks = [
  { icon: 'GlobeAltIcon', href: '#', label: 'Website' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0D1117] text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center shrink-0">
                {/* Light backdrop so the navy logo mark doesn't blend into
                    the dark footer background */}
                <div
                  className="absolute inset-0 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
                  style={{
                    background: 'linear-gradient(135deg, #EFB000 0%, #FFD040 50%, #D4960A 100%)',
                  }}
                  aria-hidden="true"
                />
                <div className="relative p-1">
                  <AppLogo size={80} />
                </div>
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">
                Swift<span className="text-[#EFB000]">Yak</span>
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Nepal&apos;s premium courier and logistics company. Delivering with speed, safety, and trust since 2018.
            </p>
            <div className="flex items-center gap-2 text-sm text-white/40">
              <Icon name="MapPinIcon" size={14} className="text-[#EFB000]" />
              <span>Balaju, Kathmandu, Nepal</span>
            </div>
          </div>

          {/* Link Groups */}
          {footerLinks?.map((group) => (
            <div key={group?.group} className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/30">
                {group?.group}
              </p>
              <ul className="space-y-3">
                {group?.links?.map((link) => (
                  <li key={link?.label}>
                    <Link
                      href={link?.href}
                      className="text-sm text-white/60 hover:text-white font-medium transition-colors duration-200"
                    >
                      {link?.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Row */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30 font-medium">
            © 2026 SwiftYak Logistics Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-white/30 hover:text-white/70 font-medium transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-xs text-white/30 hover:text-white/70 font-medium transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-xs text-white/30 hover:text-white/70 font-medium transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}