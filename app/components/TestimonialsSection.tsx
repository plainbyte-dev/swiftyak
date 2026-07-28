'use client';

import React, { useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const TESTIMONIALS = [
{
  name: 'Rajesh Shrestha',
  role: 'Owner, Himalayan Crafts Export',
  location: 'Kathmandu',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1a226a4fb-1763296724397.png",
  text: 'SwiftYak has transformed how we export our handicrafts to Europe and the US. Their customs team handles everything — we just focus on production. Our delivery success rate went from 78% to 99% after switching.',
  rating: 5,
  tag: 'Export Client'
},
{
  name: 'Priya Tamang',
  role: 'E-commerce Founder, KathmanduStyle.com',
  location: 'Lalitpur',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_19590c494-1763294888289.png",
  text: 'For my online store, speed matters. SwiftYak delivers across Nepal in 24-48 hours consistently. Their real-time tracking API integrates directly with my website, and my customers love the transparency.',
  rating: 5,
  tag: 'E-commerce'
},
{
  name: 'Amir Khalid',
  role: 'Procurement Manager, Gulf Trading Co.',
  location: 'Dubai',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1ab434767-1765717415594.png",
  text: 'We regularly import goods from Nepal to Dubai. SwiftYak\'s air freight service is remarkably reliable — documentation is always perfect, and we\'ve never had a customs delay since working with them.',
  rating: 5,
  tag: 'International Client'
},
{
  name: 'Sushila Gurung',
  role: 'Director, NepalMed Supplies',
  location: 'Pokhara',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_117d05c9b-1785220583700.png",
  text: 'Medical logistics requires zero tolerance for errors. SwiftYak\'s temperature-controlled shipping and meticulous handling has made them our exclusive logistics partner for pharmaceutical distribution nationwide.',
  rating: 5,
  tag: 'Medical Logistics'
}];


export default function TestimonialsSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS?.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const testimonial = TESTIMONIALS?.[active];

  return (
    <section className="py-20 sm:py-28 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-accent text-xs font-bold tracking-widest uppercase mb-3 block">
            Client Stories
          </span>
          <h2 className="text-section-title font-extrabold text-foreground tracking-tight">
            Trusted by Businesses<br />
            <span className="text-primary">Across Nepal & Beyond</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main testimonial */}
          <div className="bg-card rounded-3xl border border-border p-8 sm:p-12 shadow-sm mb-8 relative overflow-hidden">
            {/* Quote mark */}
            <div className="absolute top-6 right-8 text-8xl font-serif text-primary/6 leading-none select-none" aria-hidden="true">
              "
            </div>

            {/* Rating */}
            <div className="flex gap-1 mb-6">
              {Array.from({ length: testimonial?.rating })?.map((_, i) =>
              <Icon key={i} name="StarIcon" size={16} className="text-accent" variant="solid" />
              )}
            </div>

            {/* Quote */}
            <blockquote className="text-foreground text-lg sm:text-xl leading-relaxed font-medium mb-8 relative z-10">
              &ldquo;{testimonial?.text}&rdquo;
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-accent/30 shrink-0">
                <AppImage
                  src={testimonial?.avatar}
                  alt={`${testimonial?.name} profile photo`}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover" />
                
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">{testimonial?.name}</p>
                <p className="text-muted-foreground text-sm">{testimonial?.role}</p>
                <p className="text-accent text-xs font-semibold mt-0.5">{testimonial?.location}</p>
              </div>
              <span className="hidden sm:block bg-primary/8 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                {testimonial?.tag}
              </span>
            </div>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-3">
            {TESTIMONIALS?.map((_, i) =>
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all duration-300 ${
              i === active ? 'w-8 h-2.5 bg-primary' : 'w-2.5 h-2.5 bg-border hover:bg-muted-foreground'}`
              }
              aria-label={`View testimonial ${i + 1}`} />

            )}
          </div>
        </div>
      </div>
    </section>);

}