import { registerPlugin } from '@capacitor/core';

export interface Media3Plugin {
  play(options: { url: string; title: string; artist: string; albumArt: string; id: string }): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seekTo(options: { position: number }): Promise<void>;
  skipForward(): Promise<void>;
  skipBackward(): Promise<void>;
  setPlaybackRate(options: { rate: number }): Promise<void>;
  addListener(eventName: 'onStateChanged', listenerFunc: (state: { isPlaying: boolean; position: number; duration: number; id: string }) => void): any;
}

export const Media3 = registerPlugin<Media3Plugin>('Media3');
