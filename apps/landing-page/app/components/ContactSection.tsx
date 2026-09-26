'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const CONTACT_INFO = [
  {
    icon: 'MapPinIcon',
    label: 'Office',
    value: 'Balaju, Kathmandu 44600, Nepal',
    href: null,
  },
  {
    icon: 'PhoneIcon',
    label: 'Phone',
    value: '+977 9867887967',
    href: 'tel:+9779867887967',
  },
  {
    icon: 'EnvelopeIcon',
    label: 'Email',
    value: 'info@siwftyak.com.np',
    href: 'mailto:info@swiftyak.com.np',
  },
  {
    icon: 'ChatBubbleLeftEllipsisIcon',
    label: 'WhatsApp',
    value: '+977 9867887967',
    href: 'https://wa.me/9779867887967',
  },
  {
    icon: 'ClockIcon',
    label: 'Hours',
    value: 'Sun–Fri: 9:00 AM – 6:00 PM NST',
    href: null,
  },
];

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Backend integration point — connect to CRM or email service
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <section id="contact" className="py-20 sm:py-28 bg-[#EEF0F7]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-[#EFB000] text-xs font-bold tracking-widest uppercase mb-3 block">
            Get In Touch
          </span>
          <h2 className="text-section-title font-extrabold text-[#0D1117] tracking-tight">
            We&apos;re Here to<br />
            <span className="text-[#172A8A]">Help You Ship</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-[#041938] rounded-3xl p-8 text-white">
              <h3 className="font-bold text-xl mb-2">SwiftYak Logistics</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-8">
                Nepal&apos;s trusted courier and freight partner. Reach out for quotes, tracking help, or business inquiries.
              </p>

              <div className="space-y-5">
                {CONTACT_INFO.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon name={item.icon as never} size={16} className="text-[#EFB000]" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-0.5">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-white text-sm font-medium hover:text-[#EFB000] transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-white text-sm font-medium">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-[#E2E6F0] p-8 sm:p-10">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <Icon name="CheckCircleIcon" size={32} className="text-green-600" />
                  </div>
                  <h3 className="font-bold text-[#0D1117] text-xl mb-2">Message Sent!</h3>
                  <p className="text-[#6B7280] text-sm">Our team will get back to you within 2 business hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-[#0D1117] mb-2 uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Aarav Sharma"
                        className="w-full px-4 py-3 rounded-xl border border-[#E2E6F0] bg-[#F8F9FC] text-[#0D1117] text-sm focus:outline-none focus:border-[#172A8A] focus:ring-2 focus:ring-[#172A8A]/10 transition-all placeholder:text-[#6B7280]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0D1117] mb-2 uppercase tracking-wide">Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="aarav@company.com"
                        className="w-full px-4 py-3 rounded-xl border border-[#E2E6F0] bg-[#F8F9FC] text-[#0D1117] text-sm focus:outline-none focus:border-[#172A8A] focus:ring-2 focus:ring-[#172A8A]/10 transition-all placeholder:text-[#6B7280]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-[#0D1117] mb-2 uppercase tracking-wide">Phone</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+977 98XX XXXXXX"
                        className="w-full px-4 py-3 rounded-xl border border-[#E2E6F0] bg-[#F8F9FC] text-[#0D1117] text-sm focus:outline-none focus:border-[#172A8A] focus:ring-2 focus:ring-[#172A8A]/10 transition-all placeholder:text-[#6B7280]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0D1117] mb-2 uppercase tracking-wide">Subject</label>
                      <select
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#E2E6F0] bg-[#F8F9FC] text-[#0D1117] text-sm focus:outline-none focus:border-[#172A8A] focus:ring-2 focus:ring-[#172A8A]/10 transition-all"
                      >
                        <option value="">Select subject</option>
                        <option value="quote">Get a Quote</option>
                        <option value="tracking">Tracking Help</option>
                        <option value="business">Business Account</option>
                        <option value="complaint">Complaint</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0D1117] mb-2 uppercase tracking-wide">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us about your shipment needs..."
                      className="w-full px-4 py-3 rounded-xl border border-[#E2E6F0] bg-[#F8F9FC] text-[#0D1117] text-sm focus:outline-none focus:border-[#172A8A] focus:ring-2 focus:ring-[#172A8A]/10 transition-all resize-none placeholder:text-[#6B7280]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#041938] text-white font-bold py-4 rounded-xl hover:bg-[#0A2A5C] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Icon name="PaperAirplaneIcon" size={18} />
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}