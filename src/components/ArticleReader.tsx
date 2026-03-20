import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Share2 } from 'lucide-react';
import { Article, FullArticleContent } from '../types';
import { motion } from 'framer-motion';

interface ArticleReaderProps {
  article: Article;
  onClose: () => void;
}

export function ArticleReader({ article, onClose }: ArticleReaderProps) {
  const [fullContent, setFullContent] = useState<FullArticleContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFullContent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/article?url=${encodeURIComponent(article.link)}`);
        if (response.ok) {
          const data = await response.json();
          setFullContent(data);
        }
      } catch (error) {
        console.error("Failed to fetch full article", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullContent();
  }, [article.link]);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-white overflow-y-auto flex flex-col"
    >
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <div className="flex items-center gap-2">
          <a 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ExternalLink className="w-5 h-5 text-gray-800" />
          </a>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: article.title, url: article.link });
              }
            }}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <Share2 className="w-5 h-5 text-gray-800" />
          </button>
        </div>
      </div>

      {/* Article Content */}
      <div className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
          {article.title}
        </h1>
        
        {article.imageUrl && !fullContent && (
          <img 
            src={article.imageUrl} 
            alt="" 
            className="w-full h-auto rounded-xl mb-6 object-cover"
            referrerPolicy="no-referrer"
          />
        )}

        {isLoading ? (
          <div className="space-y-4 animate-pulse mt-8">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-40 bg-gray-200 rounded w-full mt-6"></div>
          </div>
        ) : fullContent?.content ? (
          <div 
            className="prose prose-lg prose-indigo max-w-none 
              prose-img:rounded-xl prose-img:w-full prose-img:object-cover
              prose-a:text-indigo-600 prose-headings:font-bold"
            dangerouslySetInnerHTML={{ __html: fullContent.content }}
          />
        ) : (
          <div 
            className="prose prose-lg prose-indigo max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content || article.contentSnippet || 'No content available.' }}
          />
        )}
      </div>
    </motion.div>
  );
}
