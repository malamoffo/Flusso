import React, { useState, useEffect } from 'react';
import { RssProvider, useRss } from './context/RssContext';
import { SwipeableArticle } from './components/SwipeableArticle';
import { ArticleReader } from './components/ArticleReader';
import { SettingsModal } from './components/SettingsModal';
import { Article } from './types';
import { RefreshCw, Rss, Inbox, Settings as SettingsIcon, CheckSquare, Search, X, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function MainContent() {
  const { articles, feeds, settings, isLoading, progress, error, refreshFeeds, toggleRead, markAllAsRead, searchQuery, setSearchQuery } = useRss();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'favorites'>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);

  const { logs, clearLogs } = useRss();

  useEffect(() => {
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }, [settings.theme]);

  const filteredArticles = articles.filter(article => {
    let matchesFilter = true;
    if (filter === 'unread') matchesFilter = !article.isRead;
    else if (filter === 'favorites') matchesFilter = article.isFavorite;
    
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matchesSearch = article.title.toLowerCase().includes(query) || 
                      (article.contentSnippet?.toLowerCase().includes(query) ?? false) ||
                      (article.content?.toLowerCase().includes(query) ?? false);
    }
    
    return matchesFilter && matchesSearch;
  });

  const unreadCount = articles.filter(a => !a.isRead).length;

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors ${
      settings.font === 'serif' ? 'font-serif' : 
      settings.font === 'mono' ? 'font-mono' : 'font-sans'
    }`}>
      {/* Top App Bar */}
      <header className="bg-white dark:bg-gray-900 sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center shadow-inner relative">
            <Rss className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-gray-900">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">flusso</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowDebugOverlay(!showDebugOverlay)} 
            className="p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-gray-300"
            title="Debug Logs"
          >
            <Terminal className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsSearchOpen(true)} 
            className="p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-gray-300"
          >
            <Search className="w-5 h-5" />
          </button>
          <button 
            onClick={() => refreshFeeds()} 
            className={`p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 ${isLoading ? 'animate-spin text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {isSearchOpen && (
        <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white focus:outline-none"
            autoFocus
          />
          <button onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} className="p-1 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Progress Indicator */}
      {progress && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 text-sm text-indigo-800 dark:text-indigo-300 flex items-center justify-between">
          <span>Updating feeds...</span>
          <span className="font-medium">{progress.current} / {progress.total}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Filter Chips */}
      <div className="bg-white dark:bg-gray-900 px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar transition-colors">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
          All Articles
        </button>
        <button 
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${filter === 'unread' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
          Unread {unreadCount > 0 && <span className="bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 text-xs px-1.5 rounded-md ml-1">{unreadCount}</span>}
        </button>
        <button 
          onClick={() => setFilter('favorites')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'favorites' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
          Favorites
        </button>
      </div>

      {/* Article List */}
      <main className="flex-1 overflow-y-auto pb-24">
        {filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 px-6 text-center">
            <Inbox className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">No articles found</p>
            <p className="text-sm">
              {feeds.length === 0 
                ? "You haven't added any feeds yet. Open Settings to get started." 
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-30 items-center">
        <button 
          onClick={() => setIsSettingsModalOpen(true)}
          className="w-12 h-12 bg-indigo-50 dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 rounded-xl shadow-md flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-gray-700 active:scale-95 transition-transform"
          title="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={() => markAllAsRead()}
          className="w-14 h-14 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-95 transition-transform"
          title="Mark all as read"
        >
          <CheckSquare className="w-6 h-6" />
        </button>
      </div>

      {/* Modals & Overlays */}
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
      
      <AnimatePresence>
        {selectedArticle && (
          <ArticleReader 
            article={selectedArticle} 
            onClose={() => setSelectedArticle(null)} 
          />
        )}
      </AnimatePresence>

      {/* Debug Logs Overlay */}
      <AnimatePresence>
        {showDebugOverlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 z-[60] bg-black/95 text-green-400 font-mono text-[10px] p-4 rounded-2xl overflow-hidden flex flex-col border border-green-900/50 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-2 border-b border-green-900/30 pb-2">
              <span className="font-bold">DEBUG_LOGS_V1</span>
              <div className="flex gap-2">
                <button onClick={clearLogs} className="px-2 py-1 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50">CLEAR</button>
                <button onClick={() => setShowDebugOverlay(false)} className="px-2 py-1 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50">CLOSE</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <div className="opacity-50 italic">No logs recorded...</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="border-b border-green-900/10 pb-2">
                    <div className="flex justify-between opacity-50 mb-1">
                      <span>[{log.level.toUpperCase()}]</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className={log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : ''}>
                      {log.message}
                    </div>
                    {log.url && <div className="opacity-40 truncate mt-0.5">{log.url}</div>}
                    {log.details && (
                      <div className="opacity-60 whitespace-pre-wrap mt-1 bg-white/5 p-1.5 rounded text-[9px] max-h-40 overflow-y-auto">
                        {log.details}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
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
