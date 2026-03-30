import React, { useState, useEffect } from 'react';
import { useRss } from './context/RssContext';
import { Settings, Plus, RefreshCw, Rss } from 'lucide-react';
import SwipeableArticle from './components/SwipeableArticle';
import ArticleReader from './components/ArticleReader';
import AddFeedModal from './components/AddFeedModal';
import SettingsModal from './components/SettingsModal';
import PersistentPlayer from './components/PersistentPlayer';
import HeaderWidgets from './components/HeaderWidgets';
import { updateService } from './services/updateService';
import { App as CapacitorApp } from '@capacitor/app';

function App() {
  const { feeds, articles, isLoading, isRefreshing, refreshFeeds } = useRss();
  const [activeTab, setActiveTab] = useState<'home' | 'starred' | 'queue'>('home');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [appUpdateAvailable, setAppUpdateAvailable] = useState(false);

  // Check for app updates
  useEffect(() => {
    const checkUpdates = async () => {
      const isAvailable = await updateService.checkForUpdates();
      setAppUpdateAvailable(isAvailable);
    };
    checkUpdates();
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (selectedArticleId) {
        setSelectedArticleId(null);
      } else if (isAddModalOpen) {
        setIsAddModalOpen(false);
      } else if (isSettingsOpen) {
        setIsSettingsOpen(false);
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      } else if (!canGoBack) {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [selectedArticleId, isAddModalOpen, isSettingsOpen, activeTab]);

  const starredArticles = articles.filter(a => a.isStarred);
  const queueArticles = articles.filter(a => a.isInQueue);

  // Filter articles by selected feed if on home tab
  const displayArticles = activeTab === 'home' 
    ? (selectedFeedId ? articles.filter(a => a.feedId === selectedFeedId) : articles)
    : [];

  const handleUpdateClick = () => {
    if (confirm('A new version is available. Would you like to download it now?')) {
      updateService.downloadAndInstallUpdate();
    }
  };

  if (isLoading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Loading feeds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed top-0 w-full z-10 pt-safe transition-colors duration-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Flusso</h1>
            {isRefreshing && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
            {appUpdateAvailable && (
              <button 
                onClick={handleUpdateClick}
                className="ml-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full font-medium"
              >
                Update Available
              </button>
            )}
          </div>
          
          <HeaderWidgets />
        </div>
      </header>

      {/* TABS CONTAINER - Usiamo display flex/hidden invece del rendering condizionale per evitare unmount e velocizzare lo switch */}
      
      {/* Home Tab */}
      <div className={`flex-1 overflow-hidden flex-col pt-[72px] ${activeTab === 'home' ? 'flex' : 'hidden'}`}>
        {/* Feed Filters */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto whitespace-nowrap hide-scrollbar flex-shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedFeedId(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedFeedId === null
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
              }`}
            >
              All Feeds
            </button>
            {feeds.map(feed => (
              <button
                key={feed.id}
                onClick={() => setSelectedFeedId(feed.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedFeedId === feed.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
                }`}
              >
                {feed.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-y-contain hide-scrollbar relative pb-32">
          {feeds.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <Rss className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Feeds Yet</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Add your first RSS feed to start reading articles.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <span>Add Feed</span>
              </button>
            </div>
          ) : displayArticles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <p>No articles found for this feed.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/50 pb-20">
              {displayArticles.map((article) => (
                <SwipeableArticle
                  key={article.id}
                  article={article}
                  onClick={() => setSelectedArticleId(article.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Starred Tab */}
      <div className={`flex-1 overflow-hidden flex-col pt-[72px] ${activeTab === 'starred' ? 'flex' : 'hidden'}`}>
        <div className="flex-1 overflow-y-auto overscroll-y-contain hide-scrollbar pb-32">
          {starredArticles.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <p>No starred articles</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/50 pb-20">
              {starredArticles.map((article) => (
                <SwipeableArticle
                  key={article.id}
                  article={article}
                  onClick={() => setSelectedArticleId(article.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Queue Tab */}
      <div className={`flex-1 overflow-hidden flex-col pt-[72px] ${activeTab === 'queue' ? 'flex' : 'hidden'}`}>
        <div className="flex-1 overflow-y-auto overscroll-y-contain hide-scrollbar pb-32">
          {queueArticles.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <p>Audio queue is empty</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/50 pb-20">
              {queueArticles.map((article) => (
                <SwipeableArticle
                  key={article.id}
                  article={article}
                  onClick={() => setSelectedArticleId(article.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PersistentPlayer />

      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe fixed bottom-0 w-full z-10 transition-colors duration-200">
        <div className="flex justify-around p-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
              activeTab === 'home' 
                ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center mb-1">
              <div className="w-3 h-3 bg-current rounded-full" />
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider">Unread</span>
          </button>
          
          <button
            onClick={() => setActiveTab('starred')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
              activeTab === 'starred' 
                ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center mb-1">
              <svg viewBox="0 0 24 24" fill={activeTab === 'starred' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider">Starred</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
              activeTab === 'queue' 
                ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center mb-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M8 18V6l8 6-8 6Z" />
              </svg>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider">Queue</span>
          </button>
        </div>
      </nav>

      {/* Overlays */}
      {selectedArticleId && (
        <ArticleReader
          articleId={selectedArticleId}
          onClose={() => setSelectedArticleId(null)}
        />
      )}

      {isAddModalOpen && (
        <AddFeedModal onClose={() => setIsAddModalOpen(false)} />
      )}

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}

export default App;