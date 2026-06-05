'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';

export type PublicTestimonial = {
  name: string;
  label: string;
  rating: number;
  message: string;
};

type TestimonialsCarouselProps = {
  testimonials: PublicTestimonial[];
};

function getVisibleCount() {
  if (typeof window === 'undefined') return 1;
  if (window.matchMedia('(min-width: 1024px)').matches) return 3;
  if (window.matchMedia('(min-width: 768px)').matches) return 2;
  return 1;
}

function TestimonialCard({
  testimonial,
  expanded,
}: {
  testimonial: PublicTestimonial;
  expanded: boolean;
}) {
  return (
    <div className="brutal-card p-6 bg-white border-[3px] border-black rounded-none shadow-[5px_5px_0px_0px_#000] hover:shadow-[7px_7px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[260px]">
      <div>
        <div className="flex items-center gap-1.5 mb-4 text-[#FFE066]" aria-label={`${testimonial.rating} dari 5 bintang`}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={`w-4 h-4 stroke-black stroke-[2px] star-spin-hover ${
                index < testimonial.rating ? 'fill-current' : 'fill-white text-neutral-250'
              }`}
            />
          ))}
        </div>
        <p className={`text-xs sm:text-sm text-neutral-700 font-bold leading-relaxed mb-6 ${expanded ? '' : 'line-clamp-5'}`}>
          &quot;{testimonial.message}&quot;
        </p>
      </div>
      <div className="border-t-[2px] border-black pt-4">
        <p className="font-black text-xs text-black uppercase">{testimonial.name}</p>
        <p className="text-[10px] font-bold text-neutral-500 uppercase">{testimonial.label}</p>
      </div>
    </div>
  );
}

export default function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const [visibleCount, setVisibleCount] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    const syncVisibleCount = () => setVisibleCount(getVisibleCount());
    syncVisibleCount();
    window.addEventListener('resize', syncVisibleCount);
    return () => window.removeEventListener('resize', syncVisibleCount);
  }, []);

  const hasTestimonials = testimonials.length > 0;
  const canNavigate = testimonials.length > visibleCount;
  const canExpand = testimonials.length > visibleCount;

  const visibleTestimonials = useMemo(() => {
    if (expanded || !canNavigate) return testimonials;
    return Array.from({ length: visibleCount }, (_, offset) => {
      const index = (currentIndex + offset) % testimonials.length;
      return testimonials[index];
    });
  }, [canNavigate, currentIndex, expanded, testimonials, visibleCount]);

  const goPrevious = () => {
    if (!canNavigate) return;
    setCurrentIndex((index) => (index - 1 + testimonials.length) % testimonials.length);
  };

  const goNext = () => {
    if (!canNavigate) return;
    setCurrentIndex((index) => (index + 1) % testimonials.length);
  };

  const handleTouchEnd = (position: number) => {
    if (touchStart === null || expanded || !canNavigate) return;
    const delta = touchStart - position;
    setTouchStart(null);
    if (Math.abs(delta) < 40) return;
    if (delta > 0) goNext();
    else goPrevious();
  };

  if (!hasTestimonials) {
    return (
      <div className="max-w-xl mx-auto bg-[#FAF9F5] border-[3px] border-black p-8 text-center shadow-[5px_5px_0px_0px_#000]">
        <p className="text-sm font-black text-black uppercase tracking-wider">Belum ada testimoni publik.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-0">
      <div
        className={`grid gap-8 ${expanded ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}
        onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
      >
        {visibleTestimonials.map((testimonial, index) => (
          <TestimonialCard
            key={`${testimonial.name}-${currentIndex}-${index}`}
            testimonial={testimonial}
            expanded={expanded}
          />
        ))}
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        {!expanded && canNavigate && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goPrevious}
              className="h-11 w-11 inline-flex items-center justify-center bg-white border-[3px] border-black text-black shadow-[3px_3px_0px_0px_#000] hover:bg-[#FFE066] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
              aria-label="Testimoni sebelumnya"
            >
              <ArrowLeft className="w-4 h-4 stroke-[3px]" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="h-11 w-11 inline-flex items-center justify-center bg-white border-[3px] border-black text-black shadow-[3px_3px_0px_0px_#000] hover:bg-[#FFE066] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
              aria-label="Testimoni berikutnya"
            >
              <ArrowRight className="w-4 h-4 stroke-[3px]" />
            </button>
          </div>
        )}

        {canExpand && (
          <button
            type="button"
            onClick={() => {
              setExpanded((value) => !value);
              setCurrentIndex(0);
            }}
            className="bg-[#FFE066] text-black border-[3px] border-black font-black uppercase text-xs tracking-wider px-6 py-3 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-none"
          >
            {expanded ? 'Sembunyikan' : 'Lihat semua ulasan'}
          </button>
        )}
      </div>
    </div>
  );
}
