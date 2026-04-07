import React, { useEffect, useState, useCallback } from 'react';
import { X, Share2, Bookmark, FileText, ExternalLink, Play, Pause, RotateCcw, RotateCw, List, AlignLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { openInApp } from '../utils/browser';
import { Article, FullArticleContent, PodcastChapter } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useRss } from '../context/RssContext';
import { useAudioState, useAudioProgress } from '../context/AudioPlayerContext';
import DOMPurify from 'dompurify';
import he from 'he';
import { CachedImage } from './CachedImage';
import { cn, getSafeUrl, formatTime, parseDurationToSeconds } from '../lib/utils';
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

const PodcastChapters = ({ chapters, currentProgress, onSeek }: { chapters: PodcastChapter[], currentProgress: number, onSeek: (time: number) => void }) => {
  return (
    <div className="space-y-2 mt-4">
      {chapters.map((chapter, i) => {
        const isCurrent = currentProgress >= chapter.startTime && (i === chapters.length - 1 || currentProgress < chapters[i + 1].startTime);
        return (
          <div 
            key={i} 
            onClick={() => onSeek(chapter.startTime)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
              isCurrent ? "bg-indigo-900/30 border border-indigo-500/30" : "bg-gray-800/50 hover:bg-gray-800"
            )}
          >
            {chapter.img && (
              <img src={chapter.img} alt="" className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <div className={cn("font-medium truncate", isCurrent ? "text-indigo-400" : "text-gray-200")}>
                {chapter.title}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {formatTime(chapter.startTime)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const ArticleReader = React.memo(function ArticleReader({ article, onClose, onNext, onPrev, hasNext, hasPrev }: ArticleReaderProps) {
  const [fullContent, setFullContent] = useState<FullArticleContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [articleThemeColor, setArticleThemeColor] = useState<string | null>(null);
  const { settings, feeds, toggleFavorite, updateArticle } = useRss();
  const feed = feeds.find(f => f.id === article.feedId);
  const { play, pause, toggle, seek, currentTrack, isPlaying, isBuffering, playNext, playPrevious } = useAudioState();
  const { progress, duration } = useAudioProgress();
  const [viewMode, setViewMode] = useState<'notes' | 'chapters'>('notes');
  const [chapters, setChapters] = useState<PodcastChapter[]>(article.chapters || []);

  const isCurrentTrack = currentTrack?.id === article.id;
  
  const [isFavorite, setIsFavorite] = useState(article.isFavorite);

  useEffect(() => {
    setIsFavorite(article.isFavorite);
  }, [article.isFavorite]);

  useEffect(() => {
    if (article.chaptersUrl && (!article.chapters || article.chapters.length === 0)) {
      fetchWithProxy(article.chaptersUrl, false).then(res => {
        try {
          const data = JSON.parse(res);
          if (data && data.chapters) {
            setChapters(data.chapters);
            updateArticle(article.id, { chapters: data.chapters });
          }
        } catch (e) {
          console.error("Failed to parse chapters JSON", e);
        }
      }).catch(console.error);
    }
  }, [article.chaptersUrl, article.chapters, article.id, updateArticle]);

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
      let sanitized = purifier.sanitize(contentToSanitize, {
        ADD_ATTR: ['style', 'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'controls', 'src', 'alt', 'width', 'height', 'srcset', 'sizes', 'sandbox', 'poster', 'preload', 'class', 'data-timestamp'],
        ADD_TAGS: ['video', 'audio', 'source', 'iframe', 'img', 'figure', 'figcaption', 'span'],
        FORBID_ATTR: ['id', 'name'],
      });

      if (article.type === 'podcast') {
        // Replace timestamps like 1:23:45 or 12:34 with clickable spans
        sanitized = sanitized.replace(/\b((?:[0-5]?\d:)?(?:[0-5]?\d):[0-5]\d)\b/g, '<span class="podcast-timestamp cursor-pointer text-indigo-400 font-mono bg-indigo-900/30 px-1 rounded" data-timestamp="$1">$1</span>');
      }

      setSanitizedContent(sanitized);
    };

    processContent();
  }, [fullContent?.content, article.content, article.contentSnippet, article.type]);

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
            {feed?.imageUrl && <img src={getSafeUrl(feed.imageUrl)} alt="" className="w-5 h-5 rounded-full object-cover" />}
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

        {article.type === 'podcast' && (
          <div className="mb-8 bg-gray-900/50 rounded-2xl p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 mx-auto">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => playPrevious()}
                  className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => isCurrentTrack && seek(Math.max(0, progress - 15))}
                  disabled={!isCurrentTrack}
                  className={cn("p-2 rounded-full transition-colors", isCurrentTrack ? "text-gray-300 hover:bg-gray-800" : "text-gray-700")}
                >
                  <RotateCcw className="w-6 h-6" />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (isCurrentTrack) {
                      toggle();
                    } else {
                      play(article);
                    }
                  }}
                  className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/20"
                >
                  {isBuffering && isCurrentTrack ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isPlaying && isCurrentTrack ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-1" />
                  )}
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => isCurrentTrack && seek(Math.min(duration, progress + 15))}
                  disabled={!isCurrentTrack}
                  className={cn("p-2 rounded-full transition-colors", isCurrentTrack ? "text-gray-300 hover:bg-gray-800" : "text-gray-700")}
                >
                  <RotateCw className="w-6 h-6" />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => playNext()}
                  className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                </motion.button>
              </div>

              {chapters.length > 0 && (
                <div className="flex bg-gray-800 rounded-lg p-1 absolute right-8">
                  <button
                    onClick={() => setViewMode('notes')}
                    className={cn("p-2 rounded-md transition-colors", viewMode === 'notes' ? "bg-gray-700 text-white" : "text-gray-400")}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('chapters')}
                    className={cn("p-2 rounded-md transition-colors", viewMode === 'chapters' ? "bg-gray-700 text-white" : "text-gray-400")}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-gray-400 mt-2">
              <span>{formatTime(isCurrentTrack ? progress : (article.progress ? article.progress * parseDurationToSeconds(article.duration) : 0))}</span>
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden relative cursor-pointer"
                onClick={(e) => {
                  if (!isCurrentTrack) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percent = x / rect.width;
                  seek(percent * duration);
                }}
              >
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${isCurrentTrack ? (progress / duration) * 100 : (article.progress || 0) * 100}%` }}
                />
                {chapters.map((ch, i) => {
                  const total = isCurrentTrack && duration > 0 ? duration : parseDurationToSeconds(article.duration);
                  if (total <= 0) return null;
                  const left = (ch.startTime / total) * 100;
                  return <div key={i} className="absolute top-0 bottom-0 w-0.5 bg-black/50" style={{ left: `${left}%` }} />;
                })}
              </div>
              <span>-{formatTime((isCurrentTrack && duration > 0 ? duration : parseDurationToSeconds(article.duration)) - (isCurrentTrack ? progress : (article.progress ? article.progress * parseDurationToSeconds(article.duration) : 0)))}</span>
            </div>
          </div>
        )}

        <hr className="border-gray-800 mb-6" />

        <div className="space-y-6">
          {viewMode === 'chapters' && chapters.length > 0 ? (
            <PodcastChapters chapters={chapters} currentProgress={isCurrentTrack ? progress : 0} onSeek={(time) => {
              if (isCurrentTrack) {
                seek(time);
              } else {
                play(article);
                setTimeout(() => seek(time), 500);
              }
            }} />
          ) : isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              <div className="h-4 bg-gray-800 rounded w-full"></div>
            </div>
          ) : sanitizedContent ? (
            <div 
              className={`prose ${getProseSize()} prose-invert max-w-full overflow-hidden text-justify`}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('podcast-timestamp')) {
                  const timeStr = target.getAttribute('data-timestamp');
                  if (timeStr) {
                    const parts = timeStr.split(':').map(Number);
                    let seconds = 0;
                    if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
                    else seconds = parts[0];
                    
                    if (isCurrentTrack) {
                      seek(seconds);
                    } else {
                      play(article);
                      setTimeout(() => seek(seconds), 500);
                    }
                  }
                }
              }}
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
