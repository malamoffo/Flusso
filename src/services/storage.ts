import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { Feed, Article, Settings } from '../types';

const FEEDS_KEY = 'rss_feeds';
const ARTICLES_KEY = 'rss_articles';
const SETTINGS_KEY = 'rss_settings';

export const defaultSettings: Settings = {
  theme: 'system',
  swipeLeftAction: 'toggleFavorite',
  swipeRightAction: 'toggleRead',
  imageDisplay: 'small',
  fontSize: 'medium'
};

export const storage = {
  async getSettings(): Promise<Settings> {
    const stored = await get<Settings>(SETTINGS_KEY);
    return { ...defaultSettings, ...stored };
  },

  async saveSettings(settings: Settings): Promise<void> {
    await set(SETTINGS_KEY, settings);
  },

  async getFeeds(): Promise<Feed[]> {
    return (await get<Feed[]>(FEEDS_KEY)) || [];
  },

  async saveFeeds(feeds: Feed[]): Promise<void> {
    await set(FEEDS_KEY, feeds);
  },

  async getArticles(): Promise<Article[]> {
    return (await get<Article[]>(ARTICLES_KEY)) || [];
  },

  async saveArticles(articles: Article[]): Promise<void> {
    await set(ARTICLES_KEY, articles);
  },

  async addFeed(feedUrl: string): Promise<{ feed: Feed; articles: Article[] }> {
    const response = await fetch(`/api/feed?url=${encodeURIComponent(feedUrl)}`);
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON response:', text.substring(0, 200));
      throw new Error(`Invalid server response (Status ${response.status})`);
    }

    if (!response.ok) {
      throw new Error(data.error || data.details || 'Failed to fetch feed');
    }
    
    const newFeed: Feed = {
      id: uuidv4(),
      title: data.title || 'Unknown Feed',
      description: data.description,
      link: data.link,
      feedUrl,
      imageUrl: data.image?.url,
      lastFetched: Date.now(),
    };

    const newArticles: Article[] = (data.items || []).map((item: any) => {
      // Try to extract image from various possible fields
      let imageUrl = null;
      if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
        imageUrl = item['media:content']['$'].url;
      } else if (item['media:thumbnail'] && item['media:thumbnail']['$'] && item['media:thumbnail']['$'].url) {
        imageUrl = item['media:thumbnail']['$'].url;
      } else if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image/')) {
        imageUrl = item.enclosure.url;
      } else {
        // Try to extract first image from content
        const content = item['content:encoded'] || item.content || item.description || '';
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) {
          imageUrl = imgMatch[1];
        }
      }

      return {
        id: uuidv4(),
        feedId: newFeed.id,
        title: item.title || 'Untitled',
        link: item.link,
        pubDate: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
        contentSnippet: item.contentSnippet || item.description?.replace(/<[^>]*>?/gm, '').substring(0, 200),
        content: item['content:encoded'] || item.content || item.description,
        imageUrl,
        isRead: false,
        isFavorite: false,
      };
    });

    const existingFeeds = await this.getFeeds();
    const existingArticles = await this.getArticles();

    // Check if feed already exists
    if (!existingFeeds.some(f => f.feedUrl === feedUrl)) {
      await this.saveFeeds([...existingFeeds, newFeed]);
      await this.saveArticles([...existingArticles, ...newArticles]);
    }

    return { feed: newFeed, articles: newArticles };
  },

  async parseOpml(opmlText: string): Promise<string[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(opmlText, 'text/xml');
    const outlines = doc.querySelectorAll('outline[xmlUrl]');
    const urls: string[] = [];
    
    outlines.forEach(outline => {
      const url = outline.getAttribute('xmlUrl');
      if (url) urls.push(url);
    });
    
    return urls;
  }
};
