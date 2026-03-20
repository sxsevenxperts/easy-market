import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Workers not supported');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });

        console.log('[PWA] Service Worker registered:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker?.addEventListener('statechange', () => {
            if (
              newWorker.state === 'activated' &&
              navigator.serviceWorker.controller
            ) {
              // New service worker ready - notify user
              console.log('[PWA] New version available, please refresh');

              // You can notify the user here
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('sw-update-ready', { detail: newWorker })
                );
              }
            }
          });
        });

        // Handle service worker updates
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    };

    // Wait for page to load before registering
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', registerServiceWorker);
      return () => document.removeEventListener('DOMContentLoaded', registerServiceWorker);
    } else {
      registerServiceWorker();
    }
  }, []);
}

export function clearServiceWorkerCache() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_CACHE',
    });
  }
}

export function requestPersistentStorage() {
  if (typeof window === 'undefined') return;

  if (navigator.storage && navigator.storage.persist) {
    navigator.storage
      .persist()
      .then((persistent) => {
        console.log(`[PWA] Persistent storage: ${persistent ? 'granted' : 'denied'}`);
      });
  }
}
