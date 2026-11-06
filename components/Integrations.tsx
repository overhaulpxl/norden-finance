'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Link2, Loader2, RotateCcw, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import { getShortcutEndpoint, regenerateShortcutToken } from '../app/actions';
import { getPublicAppUrl } from '../lib/appUrl';
import { useLanguage } from '../lib/i18n';

type GuideStep = {
  title: string;
  body: React.ReactNode;
  isEndpoint?: boolean;
};

const appUrl = getPublicAppUrl();

function EndpointBox({
  endpoint,
  copied,
  disabled,
  onCopy,
  lang,
}: {
  endpoint: string;
  copied: boolean;
  disabled: boolean;
  onCopy: () => void;
  lang: 'id' | 'en';
}) {
  return (
    <div className="mt-3 space-y-3">
      <div className="min-h-20 border-2 border-black dark:border-neutral-700 bg-black dark:bg-neutral-950 p-3 font-mono text-[11px] font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] break-all">
        {endpoint}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onCopy}
        className="inline-flex min-h-10 items-center gap-2 border-2 border-black dark:border-neutral-700 bg-[#FFE066] px-3 py-2 text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? (lang === 'en' ? 'Copied' : 'Tersalin') : (lang === 'en' ? 'Copy URL' : 'Salin URL')}
      </button>
    </div>
  );
}

function GuideCard({
  icon,
  title,
  description,
  steps,
  endpoint,
  copied,
  copyDisabled,
  onCopy,
  lang,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  steps: GuideStep[];
  endpoint: string;
  copied: boolean;
  copyDisabled: boolean;
  onCopy: () => void;
  lang: 'id' | 'en';
}) {
  return (
    <section className="border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 text-black dark:text-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:p-6">
      <div className="mb-5 flex items-center gap-4 border-b-2 border-black dark:border-neutral-700 pb-4">
        <div className="border-2 border-black dark:border-neutral-700 bg-[#f3f4f6] dark:bg-neutral-800 p-2.5 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {icon}
        </div>
        <h3 className="text-base font-black uppercase tracking-wider text-black dark:text-white">{title}</h3>
      </div>

      {description && (
        <p className="mb-5 border-2 border-black dark:border-neutral-700 bg-[#f3f4f6] dark:bg-neutral-800 p-4 text-sm font-bold leading-relaxed text-neutral-700 dark:text-neutral-300">
          {description}
        </p>
      )}

      <ol className="space-y-5">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black dark:border-neutral-700 bg-black dark:bg-neutral-800 text-xs font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm font-black text-black dark:text-white">{step.title}</p>
              <div className="mt-1 text-sm font-semibold leading-relaxed text-neutral-700 dark:text-neutral-300">{step.body}</div>
              {step.isEndpoint && (
                <EndpointBox endpoint={endpoint} copied={copied} disabled={copyDisabled} onCopy={onCopy} lang={lang} />
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Integrations() {
  const { lang } = useLanguage();
  const [endpoint, setEndpoint] = useState('');
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const displayEndpoint =
    endpoint ||
    `${appUrl}/api/shortcut?token=${lang === 'en' ? 'loading-secure-token' : 'memuat-token-aman'}`;
  const copyDisabled = !endpoint || isLoading || isPending;

  useEffect(() => {
    let active = true;

    void getShortcutEndpoint()
      .then((response) => {
        if (!active) return;
        if (response.success && response.endpoint) {
          setEndpoint(response.endpoint);
          setError('');
        } else {
          setError(
            response.error ||
              (lang === 'en'
                ? 'Failed to load shortcut endpoint.'
                : 'Gagal memuat endpoint shortcut.')
          );
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Failed to load shortcut endpoint.'
            : 'Gagal memuat endpoint shortcut.'
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lang]);

  const guideSections = useMemo(() => {
    const isEn = lang === 'en';
    const iosSteps: GuideStep[] = [
      {
        title: isEn ? 'Open Apple Shortcuts' : 'Buka Shortcuts',
        body: isEn
          ? 'On iPhone, create a new shortcut to record transactions with text input.'
          : 'Di iPhone, buat shortcut baru untuk mencatat transaksi dengan input teks.',
      },
      {
        title: isEn ? 'Add "Ask for Input"' : 'Tambahkan Ask for Input',
        body: isEn
          ? 'Use a prompt like "Today\'s expense?" for quick and consistent input.'
          : 'Pakai prompt seperti "Pengeluaran hari ini?" agar input tetap cepat dan konsisten.',
      },
      {
        title: isEn ? 'Enter Norden Endpoint' : 'Masukkan endpoint Norden',
        body: isEn
          ? 'Add a "URL" action, then paste your private endpoint below.'
          : 'Tambahkan action URL, lalu tempel endpoint pribadi di bawah ini.',
        isEndpoint: true,
      },
      {
        title: isEn ? 'Send as POST JSON' : 'Kirim sebagai POST JSON',
        body: isEn ? (
          <>
            Add &quot;Get Contents of URL&quot;, select POST, header <strong>Content-Type: application/json</strong>, and JSON body <strong>{'{"text":"[Provided Input]"}'}</strong>.
          </>
        ) : (
          <>
            Tambahkan action Get Contents of URL, pilih method POST, header <strong>Content-Type: application/json</strong>, dan body JSON <strong>{'{"text":"[Provided Input]"}'}</strong>.
          </>
        ),
      },
      {
        title: isEn ? 'Save Shortcut' : 'Simpan shortcut',
        body: isEn
          ? 'Trigger via Siri or widget, and speak or type e.g. "50k coffee cash".'
          : 'Panggil lewat Siri atau widget, lalu ucapkan contoh seperti "50 ribu makan BCA".',
      },
    ];

    const androidSteps: GuideStep[] = [
      {
        title: isEn ? 'Open HTTP Shortcuts' : 'Buka HTTP Shortcuts',
        body: isEn
          ? 'Create a new HTTP Request shortcut in the HTTP Shortcuts app.'
          : 'Buat shortcut baru bertipe HTTP Request di aplikasi HTTP Shortcuts.',
      },
      {
        title: isEn ? 'Create "text" Variable' : 'Buat variable text',
        body: isEn
          ? 'Add a User Input variable named "text" with prompt "What expense to record?".'
          : 'Tambahkan variable User Input bernama text dengan prompt seperti "Catat pengeluaran apa?".',
      },
      {
        title: isEn ? 'Enter Norden Endpoint' : 'Masukkan endpoint Norden',
        body: isEn
          ? 'Select POST method, paste your private endpoint, and set header Content-Type application/json.'
          : 'Pilih method POST, tempel endpoint pribadi, dan pakai header Content-Type application/json.',
        isEndpoint: true,
      },
      {
        title: isEn ? 'Set Request Body' : 'Isi body request',
        body: isEn ? (
          <span>Use JSON <strong>{'{"text":"{{text}}"}'}</strong> to send input to Norden.</span>
        ) : (
          <span>Pakai JSON <strong>{'{"text":"{{text}}"}'}</strong> agar input dikirim ke Norden.</span>
        ),
      },
      {
        title: isEn ? 'Add Home Screen Widget' : 'Pasang widget',
        body: isEn
          ? 'Save the shortcut and add it to Home Screen to log transactions directly.'
          : 'Simpan shortcut dan tambahkan ke Home Screen untuk mencatat transaksi dari layar utama.',
      },
    ];

    const nfcSteps: GuideStep[] = [
      {
        title: isEn ? 'Prepare Primary Shortcut' : 'Siapkan shortcut utama',
        body: isEn
          ? 'Create an iOS or Android shortcut first and ensure your private endpoint is configured.'
          : 'Buat shortcut iOS atau Android terlebih dahulu, lalu pastikan endpoint pribadi sudah tersimpan.',
      },
      {
        title: isEn ? 'Program NFC Sticker' : 'Program stiker NFC',
        body: isEn
          ? 'On iOS use NFC Automations. On Android use NFC Tools to trigger your shortcut.'
          : 'Di iOS pakai Automation NFC. Di Android pakai NFC Tools untuk memicu shortcut yang sudah dibuat.',
      },
      {
        title: isEn ? 'Enter Norden Endpoint' : 'Masukkan endpoint Norden',
        body: isEn
          ? 'If the NFC app asks for a direct webhook URL, use your private endpoint below.'
          : 'Jika aplikasi NFC meminta URL langsung, gunakan endpoint pribadi di bawah ini.',
        isEndpoint: true,
      },
      {
        title: isEn ? 'Test With Small Amount' : 'Tes dengan nominal kecil',
        body: isEn
          ? 'Try a simple input like "10k parking cash" and confirm it appears on the dashboard.'
          : 'Coba input sederhana seperti "10 ribu parkir cash" dan cek apakah transaksi masuk ke dashboard.',
      },
    ];

    return [
      {
        key: 'ios',
        title: isEn ? 'iOS Shortcuts Setup' : 'Setup iOS Shortcuts',
        icon: <Smartphone className="h-5 w-5 stroke-[2.5px]" />,
        steps: iosSteps,
      },
      {
        key: 'android',
        title: isEn ? 'Android Shortcuts Setup' : 'Setup Android Shortcuts',
        icon: <Smartphone className="h-5 w-5 stroke-[2.5px]" />,
        steps: androidSteps,
      },
      {
        key: 'nfc',
        title: isEn ? 'NFC Sticker Trigger' : 'NFC Sticker Trigger',
        icon: <Zap className="h-5 w-5 stroke-[2.5px]" />,
        description: isEn
          ? 'NFC stickers act as quick triggers. The endpoint token remains strictly private; reset your token if URL is ever exposed or device is lost.'
          : 'Stiker NFC bisa dipakai sebagai pemicu cepat. Token endpoint tetap pribadi, jadi reset token jika URL pernah dibagikan atau perangkat hilang.',
        steps: nfcSteps,
      },
    ] as const;
  }, [lang]);

  function copyEndpoint(key: string) {
    if (!endpoint) return;

    void navigator.clipboard.writeText(endpoint).then(() => {
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(''), 1800);
    });
  }

  function resetToken() {
    startTransition(async () => {
      setError('');
      const response = await regenerateShortcutToken();

      if (response.success && response.endpoint) {
        setEndpoint(response.endpoint);
        setCopiedKey('');
      } else {
        setError(
          response.error ||
            (lang === 'en'
              ? 'Failed to reset shortcut token.'
              : 'Gagal reset token shortcut.')
        );
      }
    });
  }

  return (
    <div className="max-w-7xl select-none space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-black uppercase tracking-wider text-black dark:text-white">
            {lang === 'en' ? 'Mobile Shortcuts & NFC Integration' : 'Integrasi Mobile Shortcuts & NFC'}
          </h2>
          <p className="max-w-2xl text-sm font-bold leading-relaxed text-neutral-600 dark:text-neutral-400">
            {lang === 'en'
              ? 'Log transactions via Siri, Android widgets, or NFC stickers. The endpoint on this page uses a private token, allowing usage from mobile shortcuts without browser cookies.'
              : 'Catat transaksi dari Siri, widget Android, atau stiker NFC. Endpoint di halaman ini sudah memakai token pribadi, sehingga bisa dipakai dari shortcut mobile tanpa cookie browser.'}
          </p>
        </div>
        <button
          type="button"
          onClick={resetToken}
          disabled={isPending || isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-2 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-xs font-black uppercase tracking-wider text-black dark:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-[#FFE066] dark:hover:bg-neutral-750 disabled:cursor-not-allowed disabled:opacity-50 lg:self-start cursor-pointer"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          {lang === 'en' ? 'Reset Token' : 'Reset Token'}
        </button>
      </div>

      <div className="border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black dark:text-emerald-200">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-black dark:text-emerald-300" />
          <div className="min-w-0">
            <p className="text-sm font-black text-black dark:text-emerald-100">
              {lang === 'en' ? 'Private endpoint active' : 'Endpoint pribadi aktif'}
            </p>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-emerald-950 dark:text-emerald-200">
              {lang === 'en'
                ? 'Use this URL only on your personal devices. Resetting token will invalidate all previous shortcuts until the new URL is configured.'
                : 'Gunakan URL ini hanya di perangkat Anda. Reset token akan membuat semua shortcut lama tidak bisa dipakai sampai URL baru dipasang.'}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-950 dark:text-emerald-200">
              <Link2 className="h-4 w-4 shrink-0" />
              <span className="break-all">
                {isLoading
                  ? lang === 'en'
                    ? 'Loading secure endpoint...'
                    : 'Memuat endpoint aman...'
                  : displayEndpoint}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="border-2 border-black dark:border-neutral-700 bg-red-100 dark:bg-red-950/80 p-4 text-sm font-bold text-red-900 dark:text-red-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {guideSections.map((section) => (
          <GuideCard
            key={section.key}
            icon={section.icon}
            title={section.title}
            description={'description' in section ? section.description : undefined}
            steps={section.steps}
            endpoint={displayEndpoint}
            copied={copiedKey === section.key}
            copyDisabled={copyDisabled}
            onCopy={() => copyEndpoint(section.key)}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}
