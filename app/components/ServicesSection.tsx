'use client';

import React, { useRef, useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  featured?: boolean;
  colSpan?: string;
}

const SERVICES: Service[] = [
  {
    id: 'domestic',
    title: 'Domestic Courier',
    description: 'Fast and reliable door-to-door delivery across all major cities and remote destinations within Nepal. Same-day and next-day options available.',
    icon: 'TruckIcon',
    featured: true,
    colSpan: 'md:col-span-2',
  },
  {
    id: 'international',
    title: 'International Courier',
    description: 'Send parcels and documents to 50+ countries with full tracking and insurance.',
    icon: 'GlobeAltIcon',
  },
  {
    id: 'air-freight',
    title: 'Air Freight',
    description: 'Priority air cargo for time-sensitive shipments worldwide via Kathmandu Airport.',
    icon: 'PaperAirplaneIcon',
  },
  {
    id: 'sea-freight',
    title: 'Sea Freight',
    description: 'Cost-effective ocean freight solutions for large-volume exports and imports.',
    icon: 'BuildingStorefrontIcon',
  },
  {
    id: 'road-freight',
    title: 'Road Freight',
    description: 'Dedicated road transport across Nepal, India, and China border corridors.',
    icon: 'MapIcon',
  },
  {
    id: 'freight-forwarding',
    title: 'Freight Forwarding',
    description: 'End-to-end freight management with documentation, routing, and carrier coordination.',
    icon: 'ArrowPathIcon',
  },
  {
    id: 'customs',
    title: 'Customs Clearance',
    description: 'Expert customs documentation and clearance support for smooth border crossings.',
    icon: 'DocumentCheckIcon',
  },
  {
    id: 'import',
    title: 'Import Services',
    description: 'Streamlined import logistics from sourcing to last-mile delivery in Nepal.',
    icon: 'ArrowDownTrayIcon',
  },
  {
    id: 'export',
    title: 'Export Services',
    description: 'Comprehensive export solutions for Nepali businesses reaching global markets.',
    icon: 'ArrowUpTrayIcon',
  },
  {
    id: 'business',
    title: 'Business Logistics',
    description: 'Dedicated accounts, bulk rates, and supply chain solutions for enterprises.',
    icon: 'BuildingOfficeIcon',
  },
  {
    id: 'ecommerce',
    title: 'E-commerce Logistics',
    description: 'Fulfillment, returns management, and delivery integrations for online stores.',
    icon: 'ShoppingBagIcon',
  },
  {
    id: 'document',
    title: 'Document Courier',
    description: 'Secure and tracked delivery of legal, financial, and official documents.',
    icon: 'DocumentTextIcon',
  },
  {
    id: 'medical',
    title: 'Medical Logistics',
    description: 'Temperature-controlled and compliant handling of pharmaceuticals and medical devices across Nepal and internationally.',
    icon: 'HeartIcon',
    featured: true,
    colSpan: 'md:col-span-2',
  },
];

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${service.colSpan || ''} rounded-2xl border p-6 sm:p-7 flex flex-col gap-4 cursor-pointer group opacity-100 hover:shadow-[0_20px_60px_rgba(23,42,138,0.12)] hover:-translate-y-1.5 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]`}
      style={{
        borderColor: '#E2E6F0',
        backgroundColor: '#FFFFFF',
        animation: visible ? `fadeInUp 0.6s cubic-bezier(0.23,1,0.32,1) ${index * 80}ms forwards` : 'none',
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
        style={
          service.featured
            ? { backgroundColor: '#172A8A', color: '#FFFFFF' }
            : { backgroundColor: '#EEF0F7', color: '#172A8A' }
        }
        onMouseEnter={(e) => {
          if (service.featured) {
            e.currentTarget.style.backgroundColor = '#EFB000';
            e.currentTarget.style.color = '#172A8A';
          } else {
            e.currentTarget.style.backgroundColor = '#172A8A';
            e.currentTarget.style.color = '#FFFFFF';
          }
        }}
        onMouseLeave={(e) => {
          if (service.featured) {
            e.currentTarget.style.backgroundColor = '#172A8A';
            e.currentTarget.style.color = '#FFFFFF';
          } else {
            e.currentTarget.style.backgroundColor = '#EEF0F7';
            e.currentTarget.style.color = '#172A8A';
          }
        }}
      >
        <Icon name={service.icon as never} size={22} />
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-[#0D1117] text-base sm:text-lg mb-2 group-hover:text-[#172A8A] transition-colors">
          {service.title}
        </h3>
        <p className="text-[#6B7280] text-sm leading-relaxed">
          {service.description}
        </p>
      </div>

      <div className="flex items-center gap-1.5 text-[#172A8A] text-sm font-semibold group-hover:gap-2.5 transition-all duration-200">
        Learn More
        <Icon name="ArrowRightIcon" size={14} />
      </div>
    </div>
  );
}

export default function ServicesSection() {
  return (
    <section id="services" className="py-20 sm:py-28" style={{ backgroundColor: '#F8F9FC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <span className="text-[#EFB000] text-xs font-bold tracking-widest uppercase mb-3 block">
              What We Offer
            </span>
            <h2
              className="font-extrabold text-[#0D1117] tracking-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.1 }}
            >
              Complete Logistics<br />
              <span className="text-[#172A8A]">Solutions</span>
            </h2>
          </div>
          <p className="max-w-sm text-[#6B7280] text-sm leading-relaxed md:text-right">
            From a single envelope to full container loads — SwiftYak handles every shipment with precision and care.
          </p>
        </div>

        {/* Bento Grid */}
        {/* 
          Row 1 (lg): [col-1+2: Domestic cs-2] [col-3: International]
          Row 2 (lg): [col-1: Air] [col-2: Sea] [col-3: Road]
          Row 3 (lg): [col-1: Freight] [col-2: Customs] [col-3: Import]
          Row 4 (lg): [col-1: Export] [col-2: Business] [col-3: Ecommerce]
          Row 5 (lg): [col-1: Document] [col-2+3: Medical cs-2]
          Placed 13/13 ✓
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {SERVICES.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}