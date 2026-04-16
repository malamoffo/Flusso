import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { TelegramProvider } from './context/TelegramContext';
import { RedditProvider } from './context/RedditContext';
import { RssProvider } from './context/RssContext';
import { SettingsProvider } from './context/SettingsContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext.tsx';
import { imagePersistence } from './utils/imagePersistence';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker
export const APP_VERSION = '1.0.7';
console.log(`[Flusso] Version ${APP_VERSION} starting...`);

export const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[Flusso] New version available, reloading...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[Flusso] App ready for offline use');
  },
});

// Use Capacitor App plugin to detect resume and check for updates
import { App as CapacitorApp } from '@capacitor/app';

if (typeof window !== 'undefined' && 'Capacitor' in window) {
  CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      console.log('[Flusso] App resumed, checking for updates and clearing stale sessions...');
      updateSW();
      
      // Also potentially trigger a feed refresh if we haven't in a while
      // This is handled by RssContext internally usually, but we can signal it.
      window.dispatchEvent(new CustomEvent('app-resume'));
    }
  });
}

// Check for updates every hour
setInterval(() => {
  updateSW();
}, 60 * 60 * 1000);

// Initialize image persistence cache map
imagePersistence.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <RedditProvider>
        <TelegramProvider>
          <RssProvider>
            <AudioPlayerProvider>
              <App />
            </AudioPlayerProvider>
          </RssProvider>
        </TelegramProvider>
      </RedditProvider>
    </SettingsProvider>
  </StrictMode>,
);
