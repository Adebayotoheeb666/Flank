/**
 * Service Worker Registration Utility
 * Handles PWA installation and offline functionality
 */

interface CacheInfo {
  name: string;
  count: number;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none'
    });

    console.log('[PWA] Service Worker registered successfully:', registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update().catch(err => console.error('Failed to check for SW updates:', err));
    }, 60000); // Check every minute

    // Handle new service worker becoming available
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is ready and there's an old one
            console.log('[PWA] New service worker available, prompting update');
            notifyUpdate();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Notify user about available updates
 */
function notifyUpdate() {
  if (navigator.serviceWorker.controller) {
    // Dispatch event that can be listened to by app
    window.dispatchEvent(
      new CustomEvent('sw-update-available', {
        detail: { message: 'New version available. Refresh to update.' }
      })
    );
  }
}

/**
 * Skip waiting and force activate new service worker
 */
export function skipWaitingServiceWorker(): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Clear a specific cache
 */
export async function clearCache(cacheName: string): Promise<boolean> {
  try {
    const deleted = await caches.delete(cacheName);
    console.log(`[PWA] Cache cleared: ${cacheName}`);
    return deleted;
  } catch (error) {
    console.error('[PWA] Error clearing cache:', error);
    return false;
  }
}

/**
 * Clear all application caches
 */
export async function clearAllCaches(): Promise<void> {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => name.startsWith('futa-'))
        .map(name => caches.delete(name))
    );
    console.log('[PWA] All application caches cleared');
  } catch (error) {
    console.error('[PWA] Error clearing all caches:', error);
  }
}

/**
 * Get cache information
 */
export async function getCacheInfo(): Promise<CacheInfo[]> {
  try {
    const cacheNames = await caches.keys();
    const info = await Promise.all(
      cacheNames
        .filter(name => name.startsWith('futa-'))
        .map(async (cacheName) => {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          return {
            name: cacheName,
            count: requests.length
          };
        })
    );
    return info;
  } catch (error) {
    console.error('[PWA] Error getting cache info:', error);
    return [];
  }
}

/**
 * Check if app is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline status changes
 */
export function onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Check if device is in standalone mode (PWA installed)
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log('[PWA] Persistent storage granted:', isPersisted);
      return isPersisted;
    } catch (error) {
      console.error('[PWA] Error requesting persistent storage:', error);
      return false;
    }
  }
  return false;
}

/**
 * Get estimated storage quota
 */
export async function getStorageQuota(): Promise<{ quota: number; usage: number } | null> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota || 0,
        usage: estimate.usage || 0
      };
    } catch (error) {
      console.error('[PWA] Error getting storage quota:', error);
      return null;
    }
  }
  return null;
}
