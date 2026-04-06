import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

export interface BackgroundPluginInterface {
  setupBackgroundSync(options: { feeds: { id: string; url: string; title: string; lastFetched: number }[], intervalMinutes: number }): Promise<void>;
  stopBackgroundSync(): Promise<void>;
  addListener(eventName: 'backgroundSync', listenerFunc: (data: { feeds: string[] }) => void): Promise<PluginListenerHandle> & PluginListenerHandle;
}

export const BackgroundPlugin = registerPlugin<BackgroundPluginInterface>('BackgroundPlugin');
