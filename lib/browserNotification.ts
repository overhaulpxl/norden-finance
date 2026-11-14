/**
 * Universal browser notification helper.
 * Compatible with Desktop (Chrome/Firefox/Safari/Edge), Android Chrome,
 * and iOS 16.4+ standalone PWAs.
 */

export type NotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported' | 'ios_needs_pwa';

export function getNotificationSupportStatus(): NotificationStatus {
  if (typeof window === 'undefined') return 'unsupported';

  // Check iOS Safari outside standalone PWA
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  if (isIos && !isStandalone && !('Notification' in window)) {
    return 'ios_needs_pwa';
  }

  if (!('Notification' in window)) {
    return 'unsupported';
  }

  return Notification.permission as NotificationStatus;
}

export function subscribeNotificationPermission(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  if ('permissions' in navigator && typeof navigator.permissions.query === 'function') {
    let statusObj: PermissionStatus | null = null;
    navigator.permissions
      .query({ name: 'notifications' as PermissionName })
      .then((status) => {
        statusObj = status;
        status.onchange = callback;
      })
      .catch(() => {});

    return () => {
      if (statusObj) {
        statusObj.onchange = null;
      }
    };
  }

  return () => {};
}

/**
 * Request notification permission safely supporting modern Promise and legacy callback syntax.
 */
export async function requestBrowserNotification(): Promise<NotificationPermission | 'unsupported' | 'ios_needs_pwa'> {
  if (typeof window === 'undefined') return 'unsupported';

  const currentStatus = getNotificationSupportStatus();
  if (currentStatus === 'ios_needs_pwa' || currentStatus === 'unsupported') {
    return currentStatus;
  }

  try {
    // Standard Promise-based permission request
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    // Legacy Safari callback fallback
    return new Promise((resolve) => {
      try {
        Notification.requestPermission((perm) => {
          resolve(perm);
        });
      } catch {
        resolve('denied');
      }
    });
  }
}

interface SystemNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Display a system notification.
 * Prefers ServiceWorkerRegistration.showNotification() for Android Chrome & PWA compatibility,
 * falling back to new Notification() on desktop browsers.
 */
export async function showSystemNotification(
  title: string,
  options: SystemNotificationOptions = {}
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions: SystemNotificationOptions = {
    icon: '/brand/norden-icon.png',
    badge: '/brand/norden-icon.png',
    ...options,
  };

  // 1. Try Service Worker showNotification (Mandatory for Android Chrome & iOS PWA)
  if ('serviceWorker' in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js').catch(() => undefined);
      }
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, {
          body: defaultOptions.body,
          icon: defaultOptions.icon,
          badge: defaultOptions.badge,
          tag: defaultOptions.tag,
          data: defaultOptions.data,
        });
        return true;
      }
    } catch {
      // Fall through to desktop Notification constructor fallback
    }
  }

  // 2. Fallback to desktop Notification constructor
  try {
    new Notification(title, {
      body: defaultOptions.body,
      icon: defaultOptions.icon,
      badge: defaultOptions.badge,
      tag: defaultOptions.tag,
    });
    return true;
  } catch {
    return false;
  }
}
