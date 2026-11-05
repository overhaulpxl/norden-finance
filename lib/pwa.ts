/**
 * Progressive Web App (PWA) installation detection and prompt utilities.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(canPrompt: boolean) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((listener) => listener(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    promptListeners.forEach((listener) => listener(false));
  });
}

export function subscribePwaPrompt(listener: (canPrompt: boolean) => void) {
  promptListeners.add(listener);
  listener(!!deferredPrompt);
  return () => {
    promptListeners.delete(listener);
  };
}

export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return isStandalone || isIosStandalone;
}

export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

export async function promptPwaInstall(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
  if (!deferredPrompt) return 'unsupported';
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    promptListeners.forEach((listener) => listener(false));
    return choice.outcome;
  } catch {
    return 'unsupported';
  }
}

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failed or ignored
      });
    });
  }
}

