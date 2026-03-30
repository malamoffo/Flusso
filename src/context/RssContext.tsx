import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Feed, Article } from '../types';
import { fetchFeed } from '../fetch-feed';
import { storage } from '../services/storage';

interface RssContextType {
  feeds: Feed[];
  articles: Article[];
  isLoading: boolean;
  isRefreshing: boolean;
  addFeed: (url: string) => Promise<void>;
  removeFeed: (id: string) => Promise<void>;
  refreshFeeds: () => Promise<void>;
  toggleRead: (id: string) => void;
  toggleStar: (id: string) => void;
  toggleQueue: (id: string) => void;
  updateArticleContent: (id: string, content: string, textContent: string) => void;
}

const RssContext = createContext<RssContextType | undefined>(undefined);

export const RssProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Usiamo una ref per avere sempre l'ultimo stato degli articoli all'interno
  // delle funzioni asincrone senza problemi di closure "vecchie".
  const articlesRef = useRef<Article[]>([]);

  useEffect(() => {
    articlesRef.current = articles;
  }, [articles]);

  const refreshFeeds = async (currentFeeds: Feed[] = feeds, isBackground = false) => {
    if (currentFeeds.length === 0) return;

    if (!isBackground) setIsRefreshing(true);
    
    try {
      const newArticles: Article[] = [];
      const existingUrls = new Set(articlesRef.current.map(a => a.url));
      let hasNewItems = false;

      for (const feed of currentFeeds) {
        try {
          const fetchedArticles = await fetchFeed(feed.url);
          
          // Troviamo la data dell'articolo più recente che abbiamo già scaricato per questo feed.
          // Questo ci permette di scartare subito gli articoli vecchi.
          const currentNewestDate = articlesRef.current
            .filter(a => a.feedId === feed.id)
            .reduce((max, a) => Math.max(max, a.pubDate), 0);

          const parsedArticles = fetchedArticles.map(article => ({
            ...article,
            feedId: feed.id,
            feedTitle: feed.title,
            isRead: false,
            isStarred: false,
            isInQueue: false,
          }));

          // Filtriamo tenendo SOLO gli articoli pubblicati DOPO il nostro più recente
          // E che non siano già nei nostri url (misura di sicurezza aggiuntiva)
          const trulyNewArticles = parsedArticles.filter(
            article => article.pubDate > currentNewestDate && !existingUrls.has(article.url)
          );

          if (trulyNewArticles.length > 0) {
            newArticles.push(...trulyNewArticles);
            hasNewItems = true;
          }
        } catch (error) {
          console.error(`Error refreshing feed ${feed.url}:`, error);
        }
      }

      // Aggiorniamo lo stato e lo storage SOLO se abbiamo trovato novità reali
      if (hasNewItems) {
        setArticles(prev => {
          const updatedList = [...newArticles, ...prev].sort((a, b) => b.pubDate - a.pubDate);
          storage.saveArticles(updatedList);
          return updatedList;
        });
      }
    } catch (error) {
      console.error('Error refreshing feeds:', error);
    } finally {
      if (!isBackground) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      const storedFeeds = await storage.getFeeds();
      const storedArticles = await storage.getArticles();

      if (storedFeeds.length > 0) {
        setFeeds(storedFeeds);
        if (storedArticles.length > 0) {
          setArticles(storedArticles);
        }
      }
      setIsLoading(false);

      // Ritardiamo il refresh in background in modo che l'UI si renderizzi immediatamente.
      // Eseguiamo il refresh in background (isBackground = true) così non mostriamo lo spinner.
      if (storedFeeds.length > 0) {
        setTimeout(() => {
          refreshFeeds(storedFeeds, true);
        }, 1500);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFeed = async (url: string) => {
    try {
      const feedItems = await fetchFeed(url);
      if (feedItems.length === 0) throw new Error('No items found in feed');

      const newFeed: Feed = {
        id: crypto.randomUUID(),
        url,
        title: feedItems[0].feedTitle || new URL(url).hostname,
      };

      const newFeeds = [...feeds, newFeed];
      setFeeds(newFeeds);
      await storage.saveFeeds(newFeeds);

      // Initial fetch for the new feed
      const parsedArticles = feedItems.map(article => ({
        ...article,
        feedId: newFeed.id,
        feedTitle: newFeed.title,
        isRead: false,
        isStarred: false,
        isInQueue: false,
      }));

      setArticles(prev => {
        const newArticles = [...parsedArticles, ...prev].sort((a, b) => b.pubDate - a.pubDate);
        storage.saveArticles(newArticles);
        return newArticles;
      });
    } catch (error) {
      console.error('Error adding feed:', error);
      throw error;
    }
  };

  const removeFeed = async (id: string) => {
    const newFeeds = feeds.filter(f => f.id !== id);
    setFeeds(newFeeds);
    await storage.saveFeeds(newFeeds);

    setArticles(prev => {
      const newArticles = prev.filter(a => a.feedId !== id);
      storage.saveArticles(newArticles);
      return newArticles;
    });
  };

  const toggleRead = useCallback((id: string) => {
    setArticles(prev => {
      const newArticles = prev.map(a => 
        a.id === id ? { ...a, isRead: !a.isRead } : a
      );
      storage.saveArticles(newArticles);
      return newArticles;
    });
  }, []);

  const toggleStar = useCallback((id: string) => {
    setArticles(prev => {
      const newArticles = prev.map(a => 
        a.id === id ? { ...a, isStarred: !a.isStarred } : a
      );
      storage.saveArticles(newArticles);
      return newArticles;
    });
  }, []);

  const toggleQueue = useCallback((id: string) => {
    setArticles(prev => {
      const newArticles = prev.map(a => 
        a.id === id ? { ...a, isInQueue: !a.isInQueue } : a
      );
      storage.saveArticles(newArticles);
      return newArticles;
    });
  }, []);

  const updateArticleContent = useCallback((id: string, content: string, textContent: string) => {
    setArticles(prev => {
      const newArticles = prev.map(a => 
        a.id === id ? { ...a, content, textContent, isRead: true } : a
      );
      // Non salviamo tutti gli articoli ogni volta che se ne apre uno per
      // evitare rallentamenti durante la lettura.
      storage.saveArticles(newArticles);
      return newArticles;
    });
  }, []);

  return (
    <RssContext.Provider value={{
      feeds,
      articles,
      isLoading,
      isRefreshing,
      addFeed,
      removeFeed,
      refreshFeeds,
      toggleRead,
      toggleStar,
      toggleQueue,
      updateArticleContent
    }}>
      {children}
    </RssContext.Provider>
  );
};

export const useRss = () => {
  const context = useContext(RssContext);
  if (context === undefined) {
    throw new Error('useRss must be used within a RssProvider');
  }
  return context;
};