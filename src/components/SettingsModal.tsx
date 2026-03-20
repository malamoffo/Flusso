import React, { useState } from 'react';
import { X, Moon, Sun, Monitor, Image as ImageIcon, LayoutList, Maximize, Type, Plus } from 'lucide-react';
import { useRss } from '../context/RssContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SwipeAction, Theme, ImageDisplay, FontSize } from '../types';
import { AddFeedModal } from './AddFeedModal';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useRss();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleThemeChange = (theme: Theme) => updateSettings({ theme });
  const handleImageDisplayChange = (imageDisplay: ImageDisplay) => updateSettings({ imageDisplay });
  const handleFontSizeChange = (fontSize: FontSize) => updateSettings({ fontSize });
  const handleSwipeLeftChange = (e: React.ChangeEvent<HTMLSelectElement>) => updateSettings({ swipeLeftAction: e.target.value as SwipeAction });
  const handleSwipeRightChange = (e: React.ChangeEvent<HTMLSelectElement>) => updateSettings({ swipeRightAction: e.target.value as SwipeAction });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-[28px] z-50 p-6 pb-safe max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6" />
            
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-900 pt-2 pb-4 z-10 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
              <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Feeds Management */}
              <section>
                <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Feeds</h3>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add New Feed or Import OPML
                </button>
              </section>

              {/* Theme Settings */}
              <section>
                <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Appearance</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-colors ${settings.theme === 'light' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <Sun className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-colors ${settings.theme === 'dark' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <Moon className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-colors ${settings.theme === 'system' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <Monitor className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">System</span>
                  </button>
                </div>
              </section>

              {/* Font Size Settings */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Font Size</h3>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleFontSizeChange('small')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-colors ${settings.fontSize === 'small' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <Type className="w-4 h-4 mb-1" />
                    <span className="text-xs font-medium">Small</span>
                  </button>
                  <button
                    onClick={() => handleFontSizeChange('medium')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-colors ${settings.fontSize === 'medium' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <Type className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Medium</span>
                  </button>
                  <button
                    onClick={() => handleFontSizeChange('large')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-colors ${settings.fontSize === 'large' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <Type className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Large</span>
                  </button>
                  <button
                    onClick={() => handleFontSizeChange('xlarge')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-colors ${settings.fontSize === 'xlarge' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <Type className="w-7 h-7 mb-1" />
                    <span className="text-xs font-medium">X-Large</span>
                  </button>
                </div>
              </section>

              {/* Image Display Settings */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Article Images</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleImageDisplayChange('none')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-colors ${settings.imageDisplay === 'none' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <LayoutList className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">None</span>
                  </button>
                  <button
                    onClick={() => handleImageDisplayChange('small')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-colors ${settings.imageDisplay === 'small' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <ImageIcon className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">Small</span>
                  </button>
                  <button
                    onClick={() => handleImageDisplayChange('large')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-colors ${settings.imageDisplay === 'large' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <Maximize className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">Large</span>
                  </button>
                </div>
              </section>

              {/* Gestures Settings */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Gestures</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Swipe Left Action
                    </label>
                    <select
                      value={settings.swipeLeftAction}
                      onChange={handleSwipeLeftChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="toggleRead">Toggle Read/Unread</option>
                      <option value="toggleFavorite">Toggle Favorite</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Swipe Right Action
                    </label>
                    <select
                      value={settings.swipeRightAction}
                      onChange={handleSwipeRightChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="toggleRead">Toggle Read/Unread</option>
                      <option value="toggleFavorite">Toggle Favorite</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
          <AddFeedModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </>
      )}
    </AnimatePresence>
  );
}
