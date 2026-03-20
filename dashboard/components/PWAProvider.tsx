'use client';

import { useServiceWorker, requestPersistentStorage } from '@/hooks/useServiceWorker';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Register service worker and set up PWA features
  useServiceWorker();

  useEffect(() => {
    // Request persistent storage
    requestPersistentStorage();

    // Listen for service worker updates
    const handleSWUpdate = () => {
      setUpdateAvailable(true);
      toast((t) => (
        <div className="flex flex-col gap-2">
          <p>Uma nova versão está disponível!</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="px-3 py-1 bg-accent text-white rounded text-sm font-medium hover:bg-blue-600"
            >
              Atualizar
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
            >
              Depois
            </button>
          </div>
        </div>
      ));
    };

    window.addEventListener('sw-update-ready', handleSWUpdate);
    return () => window.removeEventListener('sw-update-ready', handleSWUpdate);
  }, []);

  return <>{children}</>;
}
