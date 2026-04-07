import React, { useEffect, useState } from 'react';
import { X, Share2, Bookmark, FileText, ExternalLink } from 'lucide-react';
import { openInApp } from '../utils/browser';
import { Article, FullArticleContent } from '../types';
import { motion } from 'framer-motion';
import { useRss } from '../context/RssContext';
import { useAudioState } from '../context/AudioPlayerContext';
import DOMPurify from 'dompurify';
import he from 'he';
import { CachedImage } from './CachedImage';
import { cn, getSafeUrl } from '../lib/utils';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Readability } from '@mozilla/readability';
import { fetchWithProxy } from '../utils/proxy';
import { contentFetcher } from '../utils/contentFetcher';
import { storage, extractBestImage } from '../services/storage';
import { getColorSync } from 'colorthief';

interface ArticleReaderProps {
  article: Article;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSelectArticle?: (article: Article) => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const ArticleReader = React.memo(function ArticleReader({ article, onClose, onNext, onPrev, hasNext, hasPrev }: ArticleReaderProps) {
  const [fullContent, setFullContent] = useState<FullArticleContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [articleThemeColor, setArticleThemeColor] = useState<string | null>(null);
  const { settings, feeds, toggleFavorite, updateArticle } = useRss();
  const feed = feeds.find(f => f.id === article.feedId);
  
  const [isFavorite, setIsFavorite] = useState(article.isFavorite);

  useEffect(() => {
    setIsFavorite(article.isFavorite);
  }, [article.isFavorite]);

  useEffect(() => {
    if (article.imageUrl) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(article.imageUrl)}`;
      img.onload = () => {
        try {
          const color = getColorSync(img);
          if (color) {
            setArticleThemeColor(color.hex());
          }
        } catch (e) {
          console.error("Failed to extract color:", e);
        }
      };
      img.onerror = () => {
        if (img.src !== article.imageUrl) {
          img.src = article.imageUrl;
        } else {
          setArticleThemeColor(null);
        }
      };
    } else {
      setArticleThemeColor(null);
    }
  }, [article.imageUrl]);

  const readTime = fullContent?.textContent ? Math.max(1, Math.ceil(fullContent.textContent.split(/\s+/).length / 200)) : 1;
  const formattedDate = new Date(article.pubDate).toLocaleString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getProseSize = () => {
    switch (settings.fontSize) {
      case 'small': return 'prose-sm';
      case 'medium': return 'prose-base';
      case 'large': return 'prose-lg';
      case 'xlarge': return 'prose-xl';
      default: return 'prose-base';
    }
  };

  const getTitleSize = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-xl';
      case 'medium': return 'text-2xl';
      case 'large': return 'text-3xl';
      case 'xlarge': return 'text-4xl';
      default: return 'text-2xl';
    }
  };

  useEffect(() => {
    const fetchFullContent = async () => {
      try {
        setIsLoading(true);
        setFullContent(null);
        
        const cached = await contentFetcher.getCachedContent(article.id);
        if (cached) {
          setFullContent(cached);
          setIsLoading(false);
          return;
        }

        const html = await fetchWithProxy(article.link, false);
        if (html) {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const reader = new Readability(doc);
          const articleData = reader.parse();

          if (articleData) {
            const contentToSave = {
              title: articleData.title,
              content: articleData.content,
              textContent: articleData.textContent,
              length: articleData.length,
              excerpt: articleData.excerpt,
              byline: articleData.byline,
              dir: articleData.dir,
              siteName: articleData.siteName,
              lang: articleData.lang,
            };
            setFullContent(contentToSave);
            contentFetcher.setCachedContent(article.id, contentToSave);
            
            if (!article.imageUrl && contentToSave.content) {
              const newImageUrl = extractBestImage(contentToSave.content, article.link);
              if (newImageUrl) {
                const safeUrl = getSafeUrl(newImageUrl, '');
                if (safeUrl) {
                  updateArticle(article.id, { imageUrl: safeUrl });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('[READER] Error fetching full content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullContent();
  }, [article.link, article.id]);

  const [sanitizedContent, setSanitizedContent] = useState<string>('');

  useEffect(() => {
    const processContent = async () => {
      let contentToSanitize = fullContent?.content || article.content || article.contentSnippet || '';
      if (!contentToSanitize) {
        setSanitizedContent('');
        return;
      }
      
      contentToSanitize = he.decode(contentToSanitize);
      
      const purifier = DOMPurify();
      const sanitized = purifier.sanitize(contentToSanitize, {
        ADD_ATTR: ['style', 'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'controls', 'src', 'alt', 'width', 'height', 'srcset', 'sizes', 'sandbox', 'poster', 'preload', 'class'],
        ADD_TAGS: ['video', 'audio', 'source', 'iframe', 'img', 'figure', 'figcaption'],
        FORBID_ATTR: ['id', 'name'],
      });

      setSanitizedContent(sanitized);
    };

    processContent();
  }, [fullContent?.content, article.content, article.contentSnippet]);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex flex-col transition-colors break-words bg-black"
    >
      {articleThemeColor && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 transition-colors duration-500"
          style={{ backgroundColor: `${articleThemeColor}15` }}
        />
      )}

      <div className="sticky top-0 z-20 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center justify-between transition-colors bg-black/80">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 rounded-full hover:bg-gray-800">
          <X className="w-6 h-6 text-gray-200" />
        </motion.button>
      </div>

      <div className="relative z-10 flex-1 px-4 pt-6 pb-12 max-w-3xl mx-auto w-full">
        {article.imageUrl && (
          <CachedImage 
            src={getSafeUrl(article.imageUrl)}
            alt="" 
            className="w-full h-auto rounded-2xl mb-4 object-contain max-h-[80vh]"
            referrerPolicy="no-referrer"
          />
        )}

        <div className="text-sm text-gray-400 mb-3">
          {formattedDate} • {readTime}m read
        </div>

        <h1 className={`${getTitleSize()} font-bold text-white mb-4 leading-tight`}>
          {article.title}
        </h1>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full">
            <span className="text-sm font-medium text-gray-300">{feed?.title || 'Unknown Source'}</span>
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={async () => {
                if (Capacitor.isNativePlatform()) {
                  await Share.share({ title: article.title, url: article.link });
                } else if (navigator.share) {
                  await navigator.share({ title: article.title, url: article.link });
                }
              }}
              className="hover:text-white transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setIsFavorite(!isFavorite);
                toggleFavorite(article.id);
              }}
              className="hover:text-white transition-colors"
            >
              <Bookmark className={`w-5 h-5 ${isFavorite ? 'fill-current text-[var(--theme-color)]' : ''}`} />
            </motion.button>
          </div>
        </div>

        <hr className="border-gray-800 mb-6" />

        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              <div className="h-4 bg-gray-800 rounded w-full"></div>
            </div>
          ) : sanitizedContent ? (
            <div 
              className={`prose ${getProseSize()} prose-invert max-w-full overflow-hidden text-justify`}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          ) : (
            <div className={`prose ${getProseSize()} prose-invert max-w-full overflow-hidden text-center py-8`}>
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">We couldn't load the full content of this article.</p>
              <a href={article.link} onClick={(e) => { e.preventDefault(); openInApp(article.link); }} className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-900/30 text-indigo-400 rounded-lg hover:bg-indigo-900/50 transition-colors no-underline">
                <ExternalLink size={14} /> Read original article
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
