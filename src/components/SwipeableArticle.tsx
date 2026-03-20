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
  const { toggleRead, toggleFavorite } = useRss();
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
      // Swiped right - Toggle Read
      toggleRead(article.id);
    } else if (info.offset.x < -threshold) {
      // Swiped left - Toggle Favorite
      toggleFavorite(article.id);
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-gray-100 border-b border-gray-200">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        <div className="flex items-center text-blue-600 font-medium">
          <Check className="w-6 h-6 mr-2" />
          {article.isRead ? 'Mark Unread' : 'Mark Read'}
        </div>
        <div className="flex items-center text-amber-600 font-medium">
          {article.isFavorite ? 'Unfavorite' : 'Favorite'}
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
        className={`relative w-full bg-white p-4 cursor-pointer shadow-sm ${article.isRead ? 'opacity-60' : 'opacity-100'}`}
      >
        <div className="flex gap-4">
          {article.imageUrl && (
            <img 
              src={article.imageUrl} 
              alt="" 
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-gray-100"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-indigo-600 truncate">{feedName}</span>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {formatDistanceToNow(article.pubDate, { addSuffix: true })}
              </span>
            </div>
            <h3 className={`text-base font-semibold leading-tight mb-1 line-clamp-2 ${article.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
              {article.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2">
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
