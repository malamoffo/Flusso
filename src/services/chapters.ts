import { PodcastChapter } from '../types';
import { storage } from './storage';

export async function fetchChapters(url: string): Promise<PodcastChapter[]> {
  try {
    const content = await storage.fetchUrlContent(url);
    const data = JSON.parse(content);
    const chaptersData = data.chapters || data;
    if (Array.isArray(chaptersData)) {
      return chaptersData.map((c: any) => ({
        startTime: typeof c.startTime === 'number' ? c.startTime : parseFloat(c.startTime || 0),
        title: c.title || 'Untitled'
      }));
    }
    return [];
  } catch (e) {
    console.error('Failed to fetch chapters:', e);
    return [];
  }
}
