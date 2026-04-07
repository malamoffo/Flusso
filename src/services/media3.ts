import { registerPlugin } from '@capacitor/core';

export interface Media3Plugin {
  updateMetadata(options: { id: string; title: string; artist: string; url: string; image: string }): Promise<void>;
  play(): Promise<void>;
  resetAndPlay(): Promise<void>;
  pause(): Promise<void>;
  seek(options: { position: number }): Promise<void>;
  setFavorites(options: { favorites: any[] }): Promise<void>;
  setRecent(options: { recent: any[] }): Promise<void>;
  addListener(eventName: 'onPlaybackStateChanged', listenerFunc: (data: { isPlaying: boolean }) => void): Promise<any>;
  addListener(eventName: 'onPositionChanged', listenerFunc: (data: { position: number }) => void): Promise<any>;
  addListener(eventName: 'playRequest', listenerFunc: (data: { id: string }) => void): Promise<any>;
}

const Media3 = registerPlugin<Media3Plugin>('Media3');

export default Media3;
