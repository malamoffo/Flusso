import React, { createContext, useContext, useEffect, useState } from 'react';
import { Feed, Article } from '../types';
import { storage } from '../services/storage';

interface RssContextType {
  feeds: Feed[];
  articles: Article[];
  isLoading: boolean;
  error: string | null;
  addFeed: (url: string) => Promise<void>;
  importOpml: (file: File) => Promise<void>;
  toggleRead: (articleId: string) => Promise<void>;
  toggleFavorite: (articleId: string) => Promise<void>;
  refreshFeeds: () => Promise<void>;
  removeFeed: (feedId: string) => Promise<void>;
}

const RssContext = createContext<RssContextType | undefined>(undefined);

export function RssProvider({ children }: { children: React.ReactNode }) {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const loadedFeeds = await storage.getFeeds();
      const loadedArticles = await storage.getArticles();
      setFeeds(loadedFeeds);
      setArticles(loadedArticles.sort((a, b) => b.pubDate - a.pubDate));
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const addFeed = async (url: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await storage.addFeed(url);
      await loadData();
    } catch (err) {
      setError('Failed to add feed. Please check the URL.');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const importOpml = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      const text = await file.text();
      const urls = await storage.parseOpml(text);
      
      let successCount = 0;
      for (const url of urls) {
        try {
          await storage.addFeed(url);
          successCount++;
        } catch (e) {
          console.error(`Failed to import ${url}`, e);
        }
      }
      
      await loadData();
      if (successCount < urls.length) {
        setError(`Imported ${successCount} of ${urls.length} feeds successfully.`);
      }
    } catch (err) {
      setError('Failed to parse OPML file.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRead = async (articleId: string) => {
    const updatedArticles = articles.map(a => 
      a.id === articleId ? { ...a, isRead: !a.isRead } : a
    );
    setArticles(updatedArticles);
    await storage.saveArticles(updatedArticles);
  };

  const toggleFavorite = async (articleId: string) => {
    const updatedArticles = articles.map(a => 
      a.id === articleId ? { ...a, isFavorite: !a.isFavorite } : a
    );
    setArticles(updatedArticles);
    await storage.saveArticles(updatedArticles);
  };

  const removeFeed = async (feedId: string) => {
    const updatedFeeds = feeds.filter(f => f.id !== feedId);
    const updatedArticles = articles.filter(a => a.feedId !== feedId);
    setFeeds(updatedFeeds);
    setArticles(updatedArticles);
    await storage.saveFeeds(updatedFeeds);
    await storage.saveArticles(updatedArticles);
  };

  const refreshFeeds = async () => {
    try {
      setIsLoading(true);
      for (const feed of feeds) {
        try {
          await storage.addFeed(feed.feedUrl);
        } catch (e) {
          console.error(`Failed to refresh ${feed.feedUrl}`, e);
        }
      }
      await loadData();
    } catch (err) {
      setError('Failed to refresh feeds');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RssContext.Provider value={{
      feeds, articles, isLoading, error,
      addFeed, importOpml, toggleRead, toggleFavorite, refreshFeeds, removeFeed
    }}>
      {children}
    </RssContext.Provider>
  );
}

export const useRss = () => {
  const context = useContext(RssContext);
  if (context === undefined) {
    throw new Error('useRss must be used within a RssProvider');
  }
  return context;
};
