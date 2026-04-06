import { Browser } from '@capacitor/browser';

export const openInApp = async (url: string) => {
  try {
    console.log('Attempting to open in-app browser:', url);
    await Browser.open({ url });
  } catch (err) {
    console.error('Failed to open link in browser:', err);
    window.open(url, '_blank');
  }
};
