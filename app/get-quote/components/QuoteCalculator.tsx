'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';

const NEPAL_CITIES = [
  'Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar', 'Birgunj',
  'Dharan', 'Butwal', 'Hetauda', 'Bhaktapur', 'Janakpur',
];

const COUNTRIES = [
  'India', 'China', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Australia', 'Japan', 'Singapore', 'Germany', 'Canada',
  'South Korea', 'France', 'Malaysia', 'Thailand', 'Saudi Arabia',
  'Qatar', 'Bangladesh', 'Sri Lanka', 'Pakistan', 'Other',
];

const SERVICE_TYPES = [
  { id: 'domestic-express', label: 'Domestic Express', description: 'Same/next day within Nepal' },
  { id: 'domestic-standard', label: 'Domestic Standard', description: '2-4 days within Nepal' },
  { id: 'intl-air-express', label: 'International Air Express', description: '1-3 days worldwide' },
  { id: 'intl-air-standard', label: 'International Air Standard', description: '3-7 days worldwide' },
  { id: 'sea-freight', label: 'Sea Freight', description: '20-45 days, cost-effective' },
  { id: 'road-freight', label: 'Road Freight', description: 'India/China corridors' },
];

interface QuoteResult {
  method: string;
  price: string;
  currency: string;
  days: string;
  recommended: boolean;
  description: string;
  icon: string;
}

function calculateQuote(
  serviceId: string,
  weight: number,
  destCountry: string,
  isInternational: boolean
): QuoteResult[] {
  // Mock pricing logic — backend integration point for real rates
  const baseRates: Record<string, { pricePerKg: number; basePrice: number; days: string; icon: string }> = {
    'domestic-express': { pricePerKg: 80, basePrice: 150, days: '1 day', icon: 'BoltIcon' },
    'domestic-standard': { pricePerKg: 50, basePrice: 100, days: '2-4 days', icon: 'TruckIcon' },
    'intl-air-express': { pricePerKg: 850, basePrice: 2500, days: '1-3 days', icon: 'PaperAirplaneIcon' },
    'intl-air-standard': { pricePerKg: 550, basePrice: 1500, days: '3-7 days', icon: 'PaperAirplaneIcon' },
    'sea-freight': { pricePerKg: 120, basePrice: 8000, days: '20-45 days', icon: 'BuildingStorefrontIcon' },
    'road-freight': { pricePerKg: 90, basePrice: 1200, days: '3-8 days', icon: 'TruckIcon' },
  };

  const rate = baseRates[serviceId];
  if (!rate) return [];

  const totalNPR = Math.round(rate.basePrice + rate.pricePerKg * weight);

  const results: QuoteResult[] = [
    {
      method: SERVICE_TYPES.find((s) => s.id === serviceId)?.label || serviceId,
      price: `NPR ${totalNPR.toLocaleString()}`,
      currency: 'NPR',
      days: rate.days,
      recommended: true,
      description: SERVICE_TYPES.find((s) => s.id === serviceId)?.description || '',
      icon: rate.icon,
    },
  ];

  // Add alternative suggestions
  if (serviceId === 'intl-air-express') {
    const stdRate = baseRates['intl-air-standard'];
    const stdTotal = Math.round(stdRate.basePrice + stdRate.pricePerKg * weight);
    results.push({
      method: 'International Air Standard',
      price: `NPR ${stdTotal.toLocaleString()}`,
      currency: 'NPR',
      days: stdRate.days,
      recommended: false,
      description: 'Save ~35% with standard air',
      icon: stdRate.icon,
    });
  }

  if (isInternational && weight > 50) {
    const seaRate = baseRates['sea-freight'];
    const seaTotal = Math.round(seaRate.basePrice + seaRate.pricePerKg * weight);
    results.push({
      method: 'Sea Freight',
      price: `NPR ${seaTotal.toLocaleString()}`,
      currency: 'NPR',
      days: seaRate.days,
      recommended: false,
      description: 'Best value for heavy cargo',
      icon: seaRate.icon,
    });
  }

  return results;
}

export default function QuoteCalculator() {
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    destCountry: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    serviceType: '',
    isInternational: false,
  });
  const [results, setResults] = useState<QuoteResult[]>([]);
  const [calculated, setCalculated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.origin) newErrors.origin = 'Select origin city';
    if (!form.weight || Number(form.weight) <= 0) newErrors.weight = 'Enter valid weight';
    if (!form.serviceType) newErrors.serviceType = 'Select a service type';
    if (form.isInternational && !form.destCountry) newErrors.destCountry = 'Select destination country';
    if (!form.isInternational && !form.destination) newErrors.destination = 'Select destination city';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Simulate calculation delay — backend integration point
    setTimeout(() => {
      const quoteResults = calculateQuote(
        form.serviceType,
        Number(form.weight),
        form.destCountry,
        form.isInternational
      );
      setResults(quoteResults);
      setCalculated(true);
      setLoading(false);
    }, 900);
  };

  const handleReset = () => {
    setCalculated(false);
    setResults([]);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] pb-20">
      {/* Hero — starts at y=0 (no pt-24 on this outer wrapper) so the fixed
          Header's unscrolled white-text state sits on top of this dark
          navy gradient instead of the light page background below it.
          pt-24 is applied here instead, to still reserve space for the
          fixed header while keeping the gradient full-bleed to the top.
          Background is hardcoded inline (matches the .hero-gradient class
          in globals.css) rather than relying on the shared CSS class. */}
      <div
        className="pt-32 pb-28 px-4"
        style={{
          background:
            'linear-gradient(135deg, #0D1B6E 0%, #172A8A 35%, #1E3AA8 65%, #0A1550 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[#EFB000] text-sm font-bold tracking-widest uppercase mb-4 block">
            Instant Pricing
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-4">
            Get a Shipping Quote
          </h1>
          <p className="text-white/60 text-lg">
            Estimate your shipping cost in seconds — no account required
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-[#E2E6F0] p-6 sm:p-8 shadow-sm">
              <h2 className="font-bold text-[#0D1117] text-lg mb-6 flex items-center gap-2">
                <Icon name="CalculatorIcon" size={20} className="text-[#172A8A]" />
                Shipment Details
              </h2>

              <form onSubmit={handleCalculate} className="space-y-6">
                {/* Shipment type toggle */}
                <div>
                  <label className="block text-xs font-bold text-[#0D1117] mb-3 uppercase tracking-wide">Shipment Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Domestic', sub: 'Within Nepal', value: false },
                      { label: 'International', sub: 'Outside Nepal', value: true },
                    ].map((opt) => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => setForm({ ...form, isInternational: opt.value, destination: '', destCountry: '', serviceType: '' })}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          form.isInternational === opt.value
                            ? 'border-[#172A8A] bg-[#172A8A]/5' :'border-[#E2E6F0] hover:border-[#6B7280]'
                        }`}
                      >
                        <p className={`font-bold text-sm ${form.isInternational === opt.value ? 'text-[#172A8A]' : 'text-[#0D1117]'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[#6B7280] text-xs mt-0.5">{opt.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Origin / Destination */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#0D1117] mb-2 uppercase tracking-wide">Origin City</label>
                    <select
                      value={form.origin}
                      onChange={(e) => setForm({ ...form, origin: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border bg-[#F8F9FC] text-[#0D1117] text-sm focus:outline-none focus:ring-2 focus:ring-[#172A8A]/10 transition-all ${errors.origin ? 'border-red-400' : 'border-[#E2E6F0] focus:border-[#172A8A]'}`}
                    >
                      <option value="">Select city</option>
                      {NEPAL_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.origin && <p className="text-red-500 text-xs mt-1">{errors.origin}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0D1117] mb-2 uppercase tracking-wide">
                      {form.isInternational ? 'Destination Country' : 'Destination City'}
                    </label>
                    {form.isInternational ? (
                      <select
                        value={form.destCountry}
                        onChange={(e) => setForm({ ...form, destCountry: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border bg-[#F8F9FC] text-[#0D1117] text-sm focus:outline-none focus:ring-2 focus:ring-[#172A8A]/10 transition-all ${errors.destCountry ? 'border-red-400' : 'border-[#E2E6F0] focus:border-[#172A8A]'}`}
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <select
                        value={form.destination}
                        onChange={(e) => setForm({ ...form, destination: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border bg-[#F8F9FC] text-[#0D1117] text-sm focus:outline-none focus:ring-2 focus:ring-[#172A8A]/10 transition-all ${errors.destination ? 'border-red-400' : 'border-[#E2E6F0] focus:border-[#172A8A]'}`}
                      >
                        <option value="">Select city</option>
                        {NEPAL_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                    {(errors.destCountry || errors.destination) && (
                      <p className="text-red-500 text-xs mt-1">{errors.destCountry || errors.destination}</p>
                    )}
                  </div>
                </div>

                {/* Weight & Dimensions */}
                <div>
                  <label className="block text-xs font-bold text-[#0D1117] mb-3 uppercase tracking-wide">Weight & Dimensions</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-1">
                      <div className="relative">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={form.weight}
                          onChange={(e) => setForm({ ...form, weight: e.target.value })}
                          placeholder="0.0"
                          className={`w-full px-4 py-3 rounded-xl border bg-[#F8F9FC] text-[#0D1117] text-sm focus:outline-none focus:ring-2 focus:ring-[#172A8A]/10 transition-all ${errors.weight ? 'border-red-400' : 'border-[#E2E6F0] focus:border-[#172A8A]'}`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] font-medium">kg</span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1">Weight</p>
                      {errors.weight && <p className="text-red-500 text-xs">{errors.weight}</p>}
                    </div>
                    {[
                      { key: 'length', label: 'Length' },
                      { key: 'width', label: 'Width' },
                      { key: 'height', label: 'Height' },
                    ].map((dim) => (
                      <div key={dim.key}>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={form[dim.key as keyof typeof form] as string}
                            onChange={(e) => setForm({ ...form, [dim.key]: e.target.value })}
                            placeholder="0"
                            className="w-full px-4 py-3 rounded-xl border border-[#E2E6F0] bg-[#F8F9FC] text-[#0D1117] text-sm focus:outline-none focus:border-[#172A8A] focus:ring-2 focus:ring-[#172A8A]/10 transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] font-medium">cm</span>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-1">{dim.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-2 flex items-center gap-1">
                    <Icon name="InformationCircleIcon" size={12} />
                    Volumetric weight = L × W × H ÷ 5000. We charge whichever is greater.
                  </p>
                </div>

                {/* Service Type */}
                <div>
                  <label className="block text-xs font-bold text-[#0D1117] mb-3 uppercase tracking-wide">Service Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SERVICE_TYPES.filter((s) =>
                      form.isInternational
                        ? !s.id.startsWith('domestic')
                        : s.id.startsWith('domestic')
                    ).map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setForm({ ...form, serviceType: service.id })}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          form.serviceType === service.id
                            ? 'border-[#172A8A] bg-[#172A8A]/5' :'border-[#E2E6F0] hover:border-[#6B7280]'
                        }`}
                      >
                        <p className={`font-bold text-sm ${form.serviceType === service.id ? 'text-[#172A8A]' : 'text-[#0D1117]'}`}>
                          {service.label}
                        </p>
                        <p className="text-[#6B7280] text-xs mt-0.5">{service.description}</p>
                      </button>
                    ))}
                  </div>
                  {errors.serviceType && <p className="text-red-500 text-xs mt-1">{errors.serviceType}</p>}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#172A8A] text-white font-bold py-4 rounded-xl hover:bg-[#1E3AA8] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Icon name="ArrowPathIcon" size={18} className="animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Icon name="CalculatorIcon" size={18} />
                      Calculate Shipping Cost
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Results */}
            {calculated && results.length > 0 && (
              <div className="bg-white rounded-3xl border border-[#E2E6F0] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-[#0D1117] flex items-center gap-2">
                    <Icon name="CurrencyDollarIcon" size={18} className="text-[#172A8A]" />
                    Quote Results
                  </h3>
                  <button onClick={handleReset} className="text-xs text-[#6B7280] hover:text-[#0D1117] transition-colors flex items-center gap-1">
                    <Icon name="ArrowPathIcon" size={12} />
                    Reset
                  </button>
                </div>

                <div className="space-y-3">
                  {results.map((result, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        result.recommended
                          ? 'border-[#172A8A] bg-[#172A8A]/5' :'border-[#E2E6F0] bg-[#EEF0F7]/30'
                      }`}
                    >
                      {result.recommended && (
                        <span className="inline-flex items-center gap-1 bg-[#EFB000] text-[#172A8A] text-xs font-bold px-2.5 py-0.5 rounded-full mb-3">
                          <Icon name="StarIcon" size={10} variant="solid" />
                          Recommended
                        </span>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon name={result.icon as never} size={14} className="text-[#172A8A]" />
                            <p className="font-bold text-[#0D1117] text-sm">{result.method}</p>
                          </div>
                          <p className="text-[#6B7280] text-xs">{result.description}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Icon name="ClockIcon" size={11} className="text-[#6B7280]" />
                            <span className="text-xs text-[#6B7280] font-medium">{result.days}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-extrabold text-[#172A8A] text-base">{result.price}</p>
                          <p className="text-[#6B7280] text-xs">excl. taxes</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-[#6B7280] mt-4 leading-relaxed">
                  * Prices are estimates. Final rates may vary based on actual dimensions, fuel surcharges, and destination-specific fees.
                </p>

                <Link
                  href="/#contact"
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-[#172A8A] text-white font-bold py-3 rounded-xl hover:bg-[#1E3AA8] transition-all text-sm"
                >
                  <Icon name="PaperAirplaneIcon" size={16} />
                  Book This Shipment
                </Link>
              </div>
            )}

            {/* Why SwiftYak sidebar card */}
            <div className="bg-[#172A8A] rounded-3xl p-6 text-white">
              <h3 className="font-bold text-base mb-4">Why Ship with SwiftYak?</h3>
              <ul className="space-y-3">
                {[
                  { icon: 'ShieldCheckIcon', text: 'Fully insured shipments' },
                  { icon: 'SignalIcon', text: 'Real-time tracking included' },
                  { icon: 'DocumentCheckIcon', text: 'Customs handled for you' },
                  { icon: 'PhoneIcon', text: '24/7 WhatsApp support' },
                  { icon: 'CurrencyDollarIcon', text: 'No hidden fees' },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Icon name={item.icon as never} size={13} className="text-[#EFB000]" />
                    </div>
                    <span className="text-white/80 text-sm font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Need custom quote */}
            <div className="bg-white rounded-3xl border border-[#E2E6F0] p-6">
              <div className="w-10 h-10 rounded-xl bg-[#EFB000]/15 flex items-center justify-center mb-4">
                <Icon name="BuildingOfficeIcon" size={20} className="text-[#EFB000]" />
              </div>
              <h3 className="font-bold text-[#0D1117] text-sm mb-2">Need a Custom Quote?</h3>
              <p className="text-[#6B7280] text-xs leading-relaxed mb-4">
                For bulk freight, special cargo, or corporate contracts — our logistics team provides tailored pricing.
              </p>
              <a
                href="/#contact"
                className="inline-flex items-center gap-1.5 text-[#172A8A] text-xs font-bold hover:underline"
              >
                Contact Sales Team
                <Icon name="ArrowRightIcon" size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom info strip */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: 'ClockIcon', title: 'Instant Estimates', desc: 'Get pricing in seconds' },
            { icon: 'LockClosedIcon', title: 'No Commitment', desc: 'Quote is free, always' },
            { icon: 'PhoneIcon', title: 'Expert Advice', desc: 'Call us for complex cargo' },
            { icon: 'CheckCircleIcon', title: 'Transparent Rates', desc: 'No surprise charges' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl border border-[#E2E6F0] p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#172A8A]/8 flex items-center justify-center shrink-0">
                <Icon name={item.icon as never} size={16} className="text-[#172A8A]" />
              </div>
              <div>
                <p className="font-bold text-[#0D1117] text-xs">{item.title}</p>
                <p className="text-[#6B7280] text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}