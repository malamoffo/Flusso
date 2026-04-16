import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Subreddit, RedditPost } from '../types';
import { storage } from '../services/storage';
import DataWorker from '../workers/dataProcessor.worker.ts?worker';
import { useSettings } from './SettingsContext';

interface RedditContextType {
  subreddits: Subreddit[];
  redditPosts: RedditPost[];
  redditSort: 'new' | 'hot' | 'top';
  isLoading: boolean;
  refreshReddit: (subsToRefresh?: Subreddit[], currentPosts?: RedditPost[], sort?: 'new' | 'hot' | 'top') => Promise<void>;
  loadMoreReddit: () => Promise<void>;
  handleRedditSortChange: (sort: 'new' | 'hot' | 'top') => Promise<void>;
  toggleRedditRead: (id: string) => void;
  markRedditAsRead: (id: string) => void;
  toggleRedditFavorite: (id: string) => void;
  updateRedditPost: (id: string, updates: Partial<RedditPost>) => void;
  removeSubreddit: (id: string) => void;
  markAllRedditAsRead: () => void;
  prefetchRedditComments: (permalink: string) => Promise<void>;
  getCachedComments: (permalink: string) => any[] | null;
  redditUnreadCount: number;
}

const RedditContext = createContext<RedditContextType | undefined>(undefined);

export const RedditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [subreddits, setSubreddits] = useState<Subreddit[]>([]);
  const [redditPosts, setRedditPosts] = useState<RedditPost[]>([]);
  const [redditSort, setRedditSort] = useState<'new' | 'hot' | 'top'>('new');
  const [isLoading, setIsLoading] = useState(false);
  
  const [redditUnreadCount, setRedditUnreadCount] = useState(0);
  const { settings } = useSettings();
  
  const subredditsRef = useRef<Subreddit[]>([]);
  const redditPostsRef = useRef<RedditPost[]>([]);
  const paginationCursors = useRef<Record<string, string>>({}); // Track 'after' cursors
  const worker = useRef<Worker | undefined>(undefined);
  const commentCache = useRef<Map<string, any[]>>(new Map());
  const prefetchQueue = useRef<Set<string>>(new Set());

  useEffect(() => {
    setRedditUnreadCount(redditPosts.filter(p => !p.isRead).length);
  }, [redditPosts]);

  useEffect(() => {
    worker.current = new DataWorker();
    return () => worker.current?.terminate();
  }, []);

  useEffect(() => {
    subredditsRef.current = subreddits;
    redditPostsRef.current = redditPosts;
  }, [subreddits, redditPosts]);

  useEffect(() => {
    const loadData = async () => {
      await storage.cleanupOldRedditPosts(settings.redditRetentionDays);
      const loadedSubreddits = await storage.getSubreddits();
      const loadedRedditPosts = await storage.getRedditPosts();
      setSubreddits(loadedSubreddits);
      setRedditPosts(loadedRedditPosts.sort((a, b) => b.createdUtc - a.createdUtc));
    };
    loadData();
  }, [settings.redditRetentionDays]);

  const prefetchRedditComments = useCallback(async (permalink: string) => {
    if (commentCache.current.has(permalink) || prefetchQueue.current.has(permalink)) {
      return;
    }

    prefetchQueue.current.add(permalink);
    try {
      // Small delay to avoid overwhelming the proxy during rapid scrolling
      await new Promise(resolve => setTimeout(resolve, 500));
      const comments = await storage.fetchRedditComments(permalink);
      if (comments && comments.length > 0) {
        commentCache.current.set(permalink, comments);
        
        // Keep cache size manageable
        if (commentCache.current.size > 50) {
          const firstKey = commentCache.current.keys().next().value;
          if (firstKey) commentCache.current.delete(firstKey);
        }
      }
    } catch (e) {
      console.warn(`[Prefetch] Failed to prefetch comments for ${permalink}`);
    } finally {
      prefetchQueue.current.delete(permalink);
    }
  }, []);

  const getCachedComments = useCallback((permalink: string) => {
    return commentCache.current.get(permalink) || null;
  }, []);

  const refreshReddit = useCallback(async (subsToRefresh?: Subreddit[], currentPosts?: RedditPost[], sort?: 'new' | 'hot' | 'top') => {
    const targetSubs = subsToRefresh || subredditsRef.current;
    const targetSort = sort || redditSort;
    
    // Reset cursors on refresh
    if (!subsToRefresh) {
        paginationCursors.current = {};
    }

    if (targetSubs.length === 0) return;

    setIsLoading(true);
    try {
     const fetchPromises = targetSubs.map(async (sub) => {
        try {
          const result = await storage.fetchRedditPosts(sub.name, targetSort);
          if (result.after) {
            paginationCursors.current[sub.name] = result.after;
          }
          return result.posts;
        } catch (e) {
          console.error(`Failed to refresh r/${sub.name}`, e);
          return [];
        }
      });
      
      const results = await Promise.all(fetchPromises);
      const posts: RedditPost[] = results.flat();

      if (worker.current) {
        const handler = (e: MessageEvent) => {
          if (e.data.type === 'mergedRedditPosts') {
            const merged: RedditPost[] = e.data.merged;
            
            // Apply retention logic...
            const retentionMs = (settings.redditRetentionDays || 1) * 24 * 60 * 60 * 1000;
            const now = Date.now();
            
            let filtered = merged.filter(p => {
              if (p.isFavorite) return true;
              const isWithinRetention = (now - p.createdUtc) < retentionMs;
              const hasComments = p.numComments > 0;
              return isWithinRetention && hasComments;
            });

            if (filtered.length < 5 && merged.length > 0) {
              const sorted = [...merged].sort((a, b) => b.createdUtc - a.createdUtc);
              filtered = sorted.slice(0, 5);
            }

            setRedditPosts(filtered);
            storage.saveRedditPosts(filtered);
            worker.current!.removeEventListener('message', handler);
          }
        };
        worker.current.addEventListener('message', handler);
        worker.current.postMessage({ type: 'mergeRedditPosts', prev: redditPostsRef.current, incoming: posts, sort: targetSort });
      }
    } finally {
      setIsLoading(false);
    }
  }, [redditSort, settings.redditRetentionDays]);

  const loadMoreReddit = useCallback(async () => {
    const targetSubs = subredditsRef.current;
    if (targetSubs.length === 0) return;

    setIsLoading(true);
    try {
        const fetchPromises = targetSubs.map(async (sub) => {
           const cursor = paginationCursors.current[sub.name];
           const result = await storage.fetchRedditPosts(sub.name, redditSort, cursor);
           if (result.after) {
             paginationCursors.current[sub.name] = result.after;
           }
           return result.posts;
        });
        const results = await Promise.all(fetchPromises);
        const newPosts: RedditPost[] = results.flat();
        
        // Merge new posts with existing ones
        setRedditPosts(prev => {
            const combined = [...prev, ...newPosts];
            // Remove duplicates
            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
            // Sort by createdUtc
            unique.sort((a, b) => b.createdUtc - a.createdUtc);                
            storage.saveRedditPosts(unique);
            return unique;
        });

    } finally {
        setIsLoading(false);
    }
  }, [redditSort]);

  const handleRedditSortChange = useCallback(async (sort: 'new' | 'hot' | 'top') => {
    setRedditSort(sort);
    await refreshReddit(undefined, undefined, sort);
  }, [refreshReddit]);

  const toggleRedditRead = useCallback((id: string) => {
    setRedditPosts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, isRead: !p.isRead } : p);
      storage.saveRedditPosts(next);
      return next;
    });
  }, []);

  const markRedditAsRead = useCallback((id: string) => {
    setRedditPosts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, isRead: true } : p);
      storage.saveRedditPosts(next);
      return next;
    });
  }, []);

  const toggleRedditFavorite = useCallback((id: string) => {
    setRedditPosts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p);
      storage.saveRedditPosts(next);
      return next;
    });
  }, []);

  const updateRedditPost = useCallback((id: string, updates: Partial<RedditPost>) => {
    setRedditPosts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      storage.saveRedditPosts(next);
      return next;
    });
  }, []);

  const removeSubreddit = useCallback((id: string) => {
    setSubreddits(prev => {
      const next = prev.filter(s => s.id !== id);
      storage.saveSubreddits(next);
      return next;
    });
    // Also remove posts from that subreddit
    setRedditPosts(prev => {
      const sub = subreddits.find(s => s.id === id);
      if (!sub) return prev;
      const next = prev.filter(p => (p.subredditName || '').toLowerCase() !== sub.name.toLowerCase());
      storage.saveRedditPosts(next);
      return next;
    });
  }, [subreddits]);

  const markAllRedditAsRead = useCallback(() => {
    setRedditPosts(prev => {
      const next = prev.map(p => ({ ...p, isRead: true }));
      storage.saveRedditPosts(next);
      return next;
    });
  }, []);

  return (
    <RedditContext.Provider value={{
      subreddits, redditPosts, redditSort, isLoading,
      refreshReddit, loadMoreReddit, handleRedditSortChange,
      toggleRedditRead, markRedditAsRead, toggleRedditFavorite, updateRedditPost,
      removeSubreddit, markAllRedditAsRead, prefetchRedditComments, getCachedComments, redditUnreadCount
    }}>
      {children}
    </RedditContext.Provider>
  );
};

export const useReddit = () => {
  const context = useContext(RedditContext);
  if (context === undefined) {
    throw new Error('useReddit must be used within a RedditProvider');
  }
  return context;
};
