import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { RedditPost, RedditComment } from '../types';
import { ArrowLeft, ExternalLink, MessageSquare, ChevronUp, ChevronDown, X } from 'lucide-react';
import { storage } from '../services/storage';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { CachedImage } from './CachedImage';

interface RedditPostReaderProps {
  post: RedditPost;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const CommentNode: React.FC<{ comment: RedditComment }> = ({ comment }) => {
  return (
    <div className="mb-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-purple-400 text-xs">u/{comment.author}</span>
        <span className="text-gray-500 text-[10px]">• {format(comment.createdUtc, 'HH:mm dd/MM/yy')}</span>
        <span className="text-gray-500 text-[10px]">• ↑ {comment.score}</span>
      </div>
      <div 
        className="text-gray-300 reddit-comment-body"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.bodyHtml) }}
      />
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 pl-3 border-l-2 border-gray-800">
          {comment.replies.map(reply => (
            <CommentNode key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );
};

export const RedditPostReader = ({ post, onClose, onNext, onPrev, hasNext, hasPrev }: RedditPostReaderProps) => {
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreenImage, setIsFullScreenImage] = useState(false);

  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 200], [1, 0]);

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipe = offset.x;
    if (swipe > 100 || velocity.x > 500) {
      onClose();
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 25 });
    }
  };

  useEffect(() => {
    const loadComments = async () => {
      setIsLoading(true);
      try {
        const rawComments = await storage.fetchRedditComments(post.permalink);
        
        const parseComments = (children: any[], depth: number): RedditComment[] => {
          return children.map(child => {
            if (child.kind !== 't1') return null;
            const data = child.data;
            let replies: RedditComment[] = [];
            if (data.replies && data.replies.data && data.replies.data.children) {
              replies = parseComments(data.replies.data.children, depth + 1);
            }
            return {
              id: data.id,
              author: data.author,
              bodyHtml: data.body_html ? DOMPurify.sanitize(
                data.body_html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
              ) : '',
              score: data.score,
              createdUtc: data.created_utc * 1000,
              depth,
              replies
            };
          }).filter(Boolean) as RedditComment[];
        };

        setComments(parseComments(rawComments, 0));
      } catch (e) {
        console.error("Failed to load comments", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadComments();
  }, [post.permalink]);

  return (
    <>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{ x, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-800 bg-black/80 backdrop-blur-md z-10">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800 text-gray-300 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onPrev}
              disabled={!hasPrev}
              className="p-2 rounded-full hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none text-gray-300"
              aria-label="Previous post"
            >
              <ChevronUp className="w-6 h-6" aria-hidden="true" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onNext}
              disabled={!hasNext}
              className="p-2 rounded-full hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none text-gray-300"
              aria-label="Next post"
            >
              <ChevronDown className="w-6 h-6" aria-hidden="true" />
            </motion.button>
            <a
              href={`https://reddit.com${post.permalink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-800 text-gray-300 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]">r/{post.subredditName}</span>
              <span className="text-xs text-gray-500">• u/{post.author}</span>
              <span className="text-xs text-gray-500">• {format(post.createdUtc, 'HH:mm dd/MM/yy')}</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.title) }} />
            
            {post.imageUrl && (
              <CachedImage 
                src={post.imageUrl} 
                alt="" 
                className="w-full rounded-xl mb-4 cursor-pointer" 
                referrerPolicy="no-referrer" 
                onClick={() => setIsFullScreenImage(true)}
              />
            )}
            
            {post.selftextHtml && (
              <div 
                className="text-gray-300 text-base leading-relaxed reddit-post-body"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(
                  post.selftextHtml.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
                ) }}
              />
            )}

            <div className="flex items-center gap-4 mt-4 py-3 border-y border-gray-800 text-sm font-medium text-gray-400">
              <span className="flex items-center gap-1"><span className="text-purple-400 shadow-[0_0_5px_rgba(168,85,247,0.6)]">↑</span> {post.score}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4 text-purple-400" /> {post.numComments} Comments</span>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shadow-[0_0_10px_rgba(168,85,247,0.4)]" />
              </div>
            ) : comments.length > 0 ? (
              comments.map(comment => (
                <CommentNode key={comment.id} comment={comment} />
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No comments yet.</p>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isFullScreenImage && post.imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setIsFullScreenImage(false)}
          >
            <button 
              className="absolute top-4 right-4 p-2 bg-gray-800/50 rounded-full text-white hover:bg-gray-700 transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsFullScreenImage(false); }}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={post.imageUrl} 
              alt="Fullscreen" 
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
