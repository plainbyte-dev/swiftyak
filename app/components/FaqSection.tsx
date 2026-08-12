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
    a: 'International shipments are handled through our logistics partner\'s global delivery network. Contact us with your destination and we\'ll confirm availability before you book.',
  },
  {
    q: 'How long does international shipping take from Nepal?',
    a: 'Transit times for international shipments are set by our logistics partner and vary by destination and service level. Contact us with your route and we\'ll share the current estimated transit time for your shipment.',
  },
  {
    q: 'Do you handle customs clearance?',
    a: 'For international shipments, customs documentation and clearance are handled by our logistics partner as part of their courier service. We help you prepare the shipment on the Nepal side, but do not operate independent customs infrastructure.',
  },
  {
    q: 'What items are prohibited from shipping?',
    a: 'We cannot ship hazardous materials, illegal substances, live animals, or items prohibited by Nepal\'s customs regulations. For regulated items like electronics batteries or certain chemicals, please contact our team for guidance.',
  },
  {
    q: 'How is shipping cost calculated?',
    a: 'Pricing is based on dimensional weight (whichever is greater between actual weight and volumetric weight), destination, service type, and any special handling requirements. Use our online calculator for instant estimates.',
  },
  // {
  //   q: 'Do you offer business accounts?',
  //   a: 'Yes. Business accounts receive dedicated relationship managers, monthly invoicing, volume discounts, API integration for tracking, and priority handling. Contact our sales team to set up a corporate account.',
  // },
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