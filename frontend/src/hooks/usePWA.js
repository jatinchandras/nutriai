// src/hooks/usePWA.js
import { useState, useEffect } from 'react';

// Captures the browser's beforeinstallprompt event so we can show
// a custom "Add to Home Screen" button instead of the default browser banner.
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e) => {
      e.preventDefault(); // stop auto-prompt
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setInstallPrompt(null);
    return outcome === 'accepted';
  };

  return { canInstall: !!installPrompt && !isInstalled, isInstalled, promptInstall };
}

// Tracks online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return isOnline;
}

// Reads ?action=food or ?action=workout from URL (set by manifest shortcuts)
export function useLaunchAction() {
  const params = new URLSearchParams(window.location.search);
  const action = params.get('action'); // 'food' | 'workout' | null
  // Clean URL so refreshing doesn't re-trigger
  if (action) window.history.replaceState({}, '', '/');
  return action;
}
