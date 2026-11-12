'use client';

import Link from 'next/link';
import { MouseEvent, useMemo, useState } from 'react';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useLanguage } from '../lib/i18n';
import { useTheme } from '../lib/themeContext';

type LandingHeaderProps = {
  isLoggedIn?: boolean;
};

export default function LandingHeader({ isLoggedIn = false }: LandingHeaderProps) {
  const { lang, setLang } = useLanguage();
  const { isDark, setThemeMode } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sectionLinks = useMemo(
    () => [
      { href: '#home', label: lang === 'en' ? 'Home' : 'Beranda' },
      { href: '#features', label: lang === 'en' ? 'Features' : 'Fitur' },
      { href: '#testimonials', label: lang === 'en' ? 'Reviews' : 'Ulasan' },
      { href: '#philosophy', label: lang === 'en' ? 'Philosophy' : 'Filosofi' },
      { href: '#pricing', label: lang === 'en' ? 'Pricing' : 'Paket' },
      { href: '#faq', label: 'FAQ' },
    ],
    [lang]
  );

  function handleSectionClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    setMobileOpen(false);

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
    window.history.pushState(null, '', href);

    target.classList.add('nav-highlight');
    setTimeout(() => target.classList.remove('nav-highlight'), 1400);

    const link = event.currentTarget;
    link.classList.add('scale-click');
    setTimeout(() => link.classList.remove('scale-click'), 200);
  }

  const themeToggleBtn = (
    <button
      type="button"
      onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
      className="h-9 w-9 inline-flex items-center justify-center border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white shadow-[2px_2px_0px_0px_#000] hover:bg-[#FFE066] dark:hover:bg-neutral-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
      aria-label={
        isDark
          ? (lang === 'en' ? 'Switch to light mode' : 'Ganti ke mode terang')
          : (lang === 'en' ? 'Switch to dark mode' : 'Ganti ke mode gelap')
      }
      title={
        isDark
          ? (lang === 'en' ? 'Light mode' : 'Mode terang')
          : (lang === 'en' ? 'Dark mode' : 'Mode gelap')
      }
    >
      {isDark ? (
        <Sun className="w-4 h-4 stroke-[2.5px] text-[#FFE066]" />
      ) : (
        <Moon className="w-4 h-4 stroke-[2.5px]" />
      )}
    </button>
  );

  const languageSwitcher = (
    <div className="flex border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[2px_2px_0px_0px_#000] text-[11px] font-black uppercase tracking-wider overflow-hidden">
      <button
        type="button"
        onClick={() => setLang('id')}
        className={`px-2.5 py-1.5 transition-colors cursor-pointer ${
          lang === 'id'
            ? 'bg-[#FFE066] text-black font-black'
            : 'text-neutral-500 hover:text-black dark:hover:text-white'
        }`}
        aria-label="Bahasa Indonesia"
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2.5 py-1.5 transition-colors cursor-pointer border-l border-black dark:border-neutral-700 ${
          lang === 'en'
            ? 'bg-[#FFE066] text-black font-black'
            : 'text-neutral-500 hover:text-black dark:hover:text-white'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );

  const cta = isLoggedIn ? (
    <Link
      href="/dashboard"
      className="bg-black text-white dark:bg-white dark:text-black border-[3px] border-black dark:border-white font-black uppercase text-xs tracking-wider px-5 py-2.5 shadow-[3px_3px_0px_0px_#FFE066] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FFE066] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all rounded-none flex items-center justify-center gap-2"
      onClick={() => setMobileOpen(false)}
    >
      Dashboard <ArrowRight className="w-4 h-4 stroke-[3px]" />
    </Link>
  ) : (
    <>
      <Link
        href="/login"
        className="font-black text-xs text-black dark:text-white uppercase tracking-wider hover:underline decoration-[3px] underline-offset-4 px-3 py-2 transition-all"
        onClick={() => setMobileOpen(false)}
      >
        {lang === 'en' ? 'Log in' : 'Masuk'}
      </Link>
      <Link
        href="/register"
        className="bg-black text-white dark:bg-white dark:text-black border-[3px] border-black dark:border-white font-black uppercase text-xs tracking-wider px-5 py-2.5 shadow-[3px_3px_0px_0px_#FFE066] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FFE066] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all rounded-none text-center"
        onClick={() => setMobileOpen(false)}
      >
        {lang === 'en' ? 'Get Started' : 'Mulai Sekarang'}
      </Link>
    </>
  );

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6 max-w-7xl mx-auto pointer-events-none select-none">
      <div className="relative bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-[3px] border-black dark:border-neutral-700 px-4 sm:px-6 py-3.5 shadow-[4px_4px_0px_0px_#000] flex items-center justify-between rounded-none pointer-events-auto transition-colors">
        <Link href="#home" onClick={(event) => handleSectionClick(event, '#home')} aria-label="Norden Finance home">
          <BrandLogo variant="horizontal" priority theme="auto" className="h-10 sm:h-11 w-auto hover-wiggle" />
        </Link>

        <nav className="hidden lg:flex items-center gap-7 font-black text-xs text-black dark:text-neutral-200 uppercase tracking-wider">
          {sectionLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleSectionClick(event, link.href)}
              className="nav-link-custom py-1 hover:text-black dark:hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {themeToggleBtn}
          {languageSwitcher}
          <div className="h-5 w-[2px] bg-neutral-300 dark:bg-neutral-700 mx-1" />
          {cta}
        </div>

        {/* Mobile quick actions and drawer trigger */}
        <div className="flex md:hidden items-center gap-2">
          {themeToggleBtn}
          {languageSwitcher}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center border-[2px] border-black dark:border-neutral-700 bg-[#FFE066] dark:bg-neutral-800 text-black dark:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={
              mobileOpen
                ? (lang === 'en' ? 'Close navigation menu' : 'Tutup menu navigasi')
                : (lang === 'en' ? 'Open navigation menu' : 'Buka menu navigasi')
            }
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5 stroke-[3px]" /> : <Menu className="w-5 h-5 stroke-[3px]" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+10px)] border-[3px] border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-[4px_4px_0px_0px_#000] p-4 md:hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col gap-2 font-black text-xs uppercase tracking-wider">
              {sectionLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => handleSectionClick(event, link.href)}
                  className="border-[2px] border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 px-4 py-3 text-black dark:text-white active:bg-[#FFE066] dark:active:bg-neutral-700 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-3 border-t-[2px] border-black dark:border-neutral-700 pt-4">
              {cta}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
