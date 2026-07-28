'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const FAQS = [
  {
    q: 'How do I track my SwiftYak shipment?',
    a: 'Visit our Tracking page and enter your tracking number (format: SY250700145). You\'ll see a real-time timeline showing every checkpoint from pickup to delivery, including customs status for international shipments.',
  },
  {
    q: 'What countries does SwiftYak deliver to?',
    a: 'We deliver to 50+ countries worldwide, with key routes to India, China, UAE, UK, USA, Australia, Japan, Singapore, and across Southeast Asia and Europe. Contact us for specific country availability.',
  },
  {
    q: 'How long does international shipping take from Nepal?',
    a: 'Air freight to major destinations typically takes 3-7 business days. Sea freight takes 20-45 days depending on the destination. Express air options are available for urgent shipments with 1-3 day delivery to select countries.',
  },
  {
    q: 'Do you handle customs clearance?',
    a: 'Yes. Our dedicated customs team prepares all required documentation including commercial invoices, packing lists, certificates of origin, and handles clearance on both ends. This is included in our international shipping services.',
  },
  {
    q: 'What items are prohibited from shipping?',
    a: 'We cannot ship hazardous materials, illegal substances, live animals, or items prohibited by Nepal\'s customs regulations. For regulated items like electronics batteries or certain chemicals, please contact our team for guidance.',
  },
  {
    q: 'How is shipping cost calculated?',
    a: 'Pricing is based on dimensional weight (whichever is greater between actual weight and volumetric weight), destination, service type, and any special handling requirements. Use our online calculator for instant estimates.',
  },
  {
    q: 'Do you offer business accounts?',
    a: 'Yes. Business accounts receive dedicated relationship managers, monthly invoicing, volume discounts, API integration for tracking, and priority handling. Contact our sales team to set up a corporate account.',
  },
  {
    q: 'What are your business hours?',
    a: 'Our offices are open Sunday to Friday, 9:00 AM to 6:00 PM NST. WhatsApp and email support is available 24/7 for urgent queries. Public holidays may affect pickup schedules.',
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-accent text-xs font-bold tracking-widest uppercase mb-3 block">
            Got Questions?
          </span>
          <h2 className="text-section-title font-extrabold text-foreground tracking-tight">
            Frequently Asked<br />
            <span className="text-primary">Questions</span>
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS?.map((faq, i) => (
            <div
              key={i}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                open === i ? 'border-primary/30 bg-card shadow-sm' : 'border-border bg-card hover:border-border'
              }`}
            >
              <button
                className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className={`font-semibold text-sm sm:text-base transition-colors ${open === i ? 'text-primary' : 'text-foreground'}`}>
                  {faq?.q}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                  open === i ? 'bg-primary text-white rotate-180' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon name="ChevronDownIcon" size={16} />
                </div>
              </button>

              {open === i && (
                <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                  <div className="h-px bg-border mb-4" />
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {faq?.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}