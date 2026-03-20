import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, Star, Trash2 } from 'lucide-react';
import { Article } from '../types';
import { useRss } from '../context/RssContext';
import { formatDistanceToNow } from 'date-fns';

interface SwipeableArticleProps {
  key?: React.Key;
  article: Article;
  feedName: string;
  onClick: () => void;
}

export function SwipeableArticle({ article, feedName, onClick }: SwipeableArticleProps) {
  const { toggleRead, toggleFavorite, settings } = useRss();
  const x = useMotionValue(0);
  
  // Background colors based on swipe direction
  const background = useTransform(
    x,
    [-100, 0, 100],
    ['#f59e0b', '#ffffff', '#3b82f6'] // Amber for favorite (left), Blue for read (right)
  );

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x > threshold) {
      // Swiped right
      if (settings.swipeRightAction === 'toggleRead') toggleRead(article.id);
      else if (settings.swipeRightAction === 'toggleFavorite') toggleFavorite(article.id);
    } else if (info.offset.x < -threshold) {
      // Swiped left
      if (settings.swipeLeftAction === 'toggleRead') toggleRead(article.id);
      else if (settings.swipeLeftAction === 'toggleFavorite') toggleFavorite(article.id);
    }
  };

  const getTitleSize = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      case 'xlarge': return 'text-xl';
      case 'medium':
      default: return 'text-base';
    }
  };

  const getSnippetSize = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-xs';
      case 'large': return 'text-base';
      case 'xlarge': return 'text-lg';
      case 'medium':
      default: return 'text-sm';
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return '';
    }
  };

  const domain = getDomain(article.link);

  return (
    <div className="relative w-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
          <Check className="w-6 h-6 mr-2" />
          {settings.swipeRightAction === 'toggleRead' ? (article.isRead ? 'Mark Unread' : 'Mark Read') : 
           settings.swipeRightAction === 'toggleFavorite' ? (article.isFavorite ? 'Unfavorite' : 'Favorite') : ''}
        </div>
        <div className="flex items-center text-amber-600 dark:text-amber-400 font-medium">
          {settings.swipeLeftAction === 'toggleRead' ? (article.isRead ? 'Mark Unread' : 'Mark Read') : 
           settings.swipeLeftAction === 'toggleFavorite' ? (article.isFavorite ? 'Unfavorite' : 'Favorite') : ''}
          <Star className="w-6 h-6 ml-2" />
        </div>
      </div>

      {/* Foreground Draggable Card */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        onClick={onClick}
        className={`relative w-full bg-white dark:bg-gray-900 p-4 cursor-pointer shadow-sm transition-colors`}
      >
        <div className={`flex ${settings.imageDisplay === 'large' ? 'flex-col' : 'gap-4'}`}>
          {article.imageUrl && settings.imageDisplay !== 'none' && (
            <img 
              src={article.imageUrl} 
              alt="" 
              className={`${settings.imageDisplay === 'large' ? 'w-full h-48 mb-3' : 'w-20 h-20'} object-cover rounded-lg flex-shrink-0 bg-gray-100 dark:bg-gray-800 transition-opacity ${article.isRead ? 'opacity-50 grayscale' : 'opacity-100'}`}
              referrerPolicy="no-referrer"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                {domain && (
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} 
                    alt="" 
                    className={`w-4 h-4 rounded-sm flex-shrink-0 ${article.isRead ? 'opacity-50 grayscale' : 'opacity-100'}`}
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className={`text-xs font-medium truncate ${article.isRead ? 'text-gray-500 dark:text-gray-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {feedName}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                {formatDistanceToNow(article.pubDate, { addSuffix: true })}
              </span>
            </div>
            <h3 className={`${getTitleSize()} font-semibold leading-tight mb-1 line-clamp-2 ${article.isRead ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
              {article.title}
            </h3>
            <p className={`${getSnippetSize()} text-gray-500 dark:text-gray-400 line-clamp-2`}>
              {article.contentSnippet}
            </p>
          </div>
          {article.isFavorite && (
            <div className="absolute top-4 right-4">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
