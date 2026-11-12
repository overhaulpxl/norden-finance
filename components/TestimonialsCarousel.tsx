'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import type { PublicTestimonial } from '../lib/landingFallbacks';
import { useLanguage } from '../lib/i18n';

type TestimonialsCarouselProps = {
  testimonials: PublicTestimonial[];
  testimonialsUrl?: string;
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
  lang,
}: {
  testimonial: PublicTestimonial;
  expanded: boolean;
  lang: string;
}) {
  return (
    <div className="brutal-card p-6 bg-white text-black border-[2.5px] border-black rounded-none shadow-[5px_5px_0px_0px_#000] hover:shadow-[7px_7px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[260px]">
      <div>
        <div
          className="flex items-center gap-1 mb-4"
          aria-label={lang === 'en' ? `${testimonial.rating} out of 5 stars` : `${testimonial.rating} dari 5 bintang`}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={`w-4 h-4 stroke-black stroke-[2px] ${
                index < testimonial.rating
                  ? 'fill-[#FFE066] text-[#FFE066]'
                  : 'fill-neutral-200 text-neutral-300'
              }`}
            />
          ))}
        </div>
        <p className={`text-xs sm:text-sm text-neutral-800 font-bold leading-relaxed mb-6 text-justify ${expanded ? '' : 'line-clamp-5'}`}>
          &quot;{testimonial.message}&quot;
        </p>
      </div>
      <div className="border-t-[2px] border-black pt-4">
        <p className="font-black text-xs text-black uppercase tracking-wide">{testimonial.name}</p>
        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">{testimonial.label}</p>
      </div>
    </div>
  );
}

function isPublicTestimonial(value: unknown): value is PublicTestimonial {
  if (!value || typeof value !== 'object') return false;
  const testimonial = value as Partial<PublicTestimonial>;
  return (
    typeof testimonial.name === 'string' &&
    typeof testimonial.label === 'string' &&
    typeof testimonial.message === 'string' &&
    typeof testimonial.rating === 'number'
  );
}

export default function TestimonialsCarousel({
  testimonials,
  testimonialsUrl = '/api/public/testimonials',
}: TestimonialsCarouselProps) {
  const { lang } = useLanguage();
  const [fetchedItems, setFetchedItems] = useState<PublicTestimonial[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const items = fetchedItems?.length ? fetchedItems : testimonials;
  const safeCurrentIndex = items.length > 0 ? Math.min(currentIndex, items.length - 1) : 0;

  useEffect(() => {
    if (!testimonialsUrl) return;

    const controller = new AbortController();

    async function loadTestimonials() {
      try {
        const response = await fetch(testimonialsUrl, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data: unknown = await response.json();
        const nextTestimonials = Array.isArray((data as { testimonials?: unknown }).testimonials)
          ? (data as { testimonials: unknown[] }).testimonials.filter(isPublicTestimonial)
          : [];

        if (nextTestimonials.length > 0) {
          setFetchedItems(nextTestimonials);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setFetchedItems(null);
        }
      }
    }

    loadTestimonials();
    return () => controller.abort();
  }, [testimonialsUrl]);

  useEffect(() => {
    const syncVisibleCount = () => setVisibleCount(getVisibleCount());
    syncVisibleCount();
    window.addEventListener('resize', syncVisibleCount);
    return () => window.removeEventListener('resize', syncVisibleCount);
  }, []);

  const hasTestimonials = items.length > 0;
  const canNavigate = items.length > visibleCount;
  const canExpand = items.length > visibleCount;

  const visibleTestimonials = useMemo(() => {
    if (expanded || !canNavigate) return items;
    return Array.from({ length: visibleCount }, (_, offset) => {
      const index = (safeCurrentIndex + offset) % items.length;
      return items[index];
    });
  }, [canNavigate, expanded, items, safeCurrentIndex, visibleCount]);

  const goPrevious = () => {
    if (!canNavigate) return;
    setCurrentIndex((index) => (index - 1 + items.length) % items.length);
  };

  const goNext = () => {
    if (!canNavigate) return;
    setCurrentIndex((index) => (index + 1) % items.length);
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
            lang={lang}
          />
        ))}
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        {!expanded && canNavigate && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goPrevious}
              className="h-11 w-11 inline-flex items-center justify-center bg-white border-2 border-black text-black shadow-[3px_3px_0px_0px_#000] hover:bg-[#FFE066] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
              aria-label={lang === 'en' ? 'Previous testimonial' : 'Testimoni sebelumnya'}
            >
              <ArrowLeft className="w-4 h-4 stroke-[3px]" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="h-11 w-11 inline-flex items-center justify-center bg-white border-2 border-black text-black shadow-[3px_3px_0px_0px_#000] hover:bg-[#FFE066] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
              aria-label={lang === 'en' ? 'Next testimonial' : 'Testimoni berikutnya'}
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
            {expanded
              ? (lang === 'en' ? 'Hide' : 'Sembunyikan')
              : (lang === 'en' ? 'View all reviews' : 'Lihat semua ulasan')}
          </button>
        )}
      </div>
    </div>
  );
}
