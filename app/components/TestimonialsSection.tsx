'use client';

import React, { useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

// No real customer testimonials exist yet. Do not add placeholder/fabricated
// quotes here — populate this array only with verified customer quotes.
const TESTIMONIALS: {
  name: string;
  role: string;
  location: string;
  avatar: string;
  text: string;
  rating: number;
  tag: string;
}[] = [];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (TESTIMONIALS.length === 0) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS?.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  if (TESTIMONIALS.length === 0) return null;

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