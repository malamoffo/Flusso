import React, { useState } from 'react';
import { RssProvider, useRss } from './context/RssContext';
import { SwipeableArticle } from './components/SwipeableArticle';
import { ArticleReader } from './components/ArticleReader';
import { AddFeedModal } from './components/AddFeedModal';
import { Article } from './types';
import { Menu, Plus, RefreshCw, Rss, Star, Inbox } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

function MainContent() {
  const { articles, feeds, isLoading, refreshFeeds, toggleRead } = useRss();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'favorites'>('all');

  const filteredArticles = articles.filter(article => {
    if (filter === 'unread') return !article.isRead;
    if (filter === 'favorites') return article.isFavorite;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top App Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
            <Rss className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">FeedReader</h1>
        </div>
        <button 
          onClick={() => refreshFeeds()} 
          className={`p-2 rounded-full hover:bg-gray-100 ${isLoading ? 'animate-spin text-indigo-600' : 'text-gray-600'}`}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      {/* Filter Chips */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex gap-2 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All Articles
        </button>
        <button 
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'unread' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Unread
        </button>
        <button 
          onClick={() => setFilter('favorites')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'favorites' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Favorites
        </button>
      </div>

      {/* Article List */}
      <main className="flex-1 overflow-y-auto pb-24">
        {filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 px-6 text-center">
            <Inbox className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-900 mb-1">No articles found</p>
            <p className="text-sm">
              {feeds.length === 0 
                ? "You haven't added any feeds yet. Tap the + button to get started." 
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredArticles.map(article => {
              const feed = feeds.find(f => f.id === article.feedId);
              return (
                <SwipeableArticle 
                  key={article.id} 
                  article={article} 
                  feedName={feed?.title || 'Unknown Feed'}
                  onClick={() => {
                    setSelectedArticle(article);
                    if (!article.isRead) {
                      toggleRead(article.id);
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-transform z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals & Overlays */}
      <AddFeedModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      
      <AnimatePresence>
        {selectedArticle && (
          <ArticleReader 
            article={selectedArticle} 
            onClose={() => setSelectedArticle(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <RssProvider>
      <MainContent />
    </RssProvider>
  );
}
