import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, Share2, Bookmark, Type, Palette, Layout, Eye, List, Grid, Layers, AlignJustify, Star, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from '../context/SettingsContext';

interface StylePreviewProps {
  onClose: () => void;
}

const SAMPLE_ARTICLE = {
  title: "L'intelligenza artificiale e la nascita di una nuova violenza politica",
  author: "Rivista AI",
  date: "15 Aprile 2026",
  readTime: "6 min",
  content: `
    <p>Il punto non è la molotov. Il punto è che qualcuno, nel 2026, ha ritenuto razionale lanciare una molotov contro un server farm. Non per odio verso le macchine, ma per odio verso chi le possiede.</p>
    <p>Siamo entrati in una nuova era della conflittualità sociale, dove l'algoritmo non è più solo uno strumento di controllo, ma il campo di battaglia stesso. La violenza politica, che credevamo relegata ai libri di storia del secolo scorso, sta riemergendo con una grammatica completamente nuova.</p>
    <p>Le infrastrutture digitali sono diventate i nuovi palazzi del potere. Proteggere un data center oggi equivale a proteggere un parlamento negli anni '70. Ma la differenza è che il data center è invisibile, delocalizzato, eppure onnipresente nelle nostre vite.</p>
    <blockquote>"La rivoluzione non sarà trasmessa in TV, sarà calcolata in tempo reale da un'istanza cloud che non puoi spegnere."</blockquote>
    <p>Mentre i governi cercano di regolamentare l'output delle IA, i movimenti radicali si concentrano sull'input: l'energia, l'acqua per il raffreddamento, i cavi sottomarini. È una guerriglia fisica contro un'entità metafisica.</p>
  `,
  imageUrl: "https://picsum.photos/seed/ai-violence/1200/600"
};

const SAMPLE_LIST = [
  { id: '1', title: "SpaceX lancia altri 22 satelliti Starlink", source: "TechCrunch", date: "2 ore fa", image: "https://picsum.photos/seed/space/400/300", isRead: false },
  { id: '2', title: "Il futuro del lavoro remoto nel 2026", source: "Wired", date: "5 ore fa", image: "https://picsum.photos/seed/work/400/300", isRead: true },
  { id: '3', title: "Nuova scoperta archeologica in Egitto", source: "National Geographic", date: "ieri", image: "https://picsum.photos/seed/egypt/400/300", isRead: false },
];

type PreviewMode = 'articles' | 'lists';
type ArticleStyle = 'editorial' | 'bento' | 'glass' | 'zen';
type ListStyle = 'minimal' | 'bento' | 'magazine' | 'compact';

export const StylePreview: React.FC<StylePreviewProps> = ({ onClose }) => {
  const { settings, updateSettings } = useSettings();
  const [activeListStyle, setActiveListStyle] = useState<ListStyle>(settings.listStyle || 'magazine');

  const listStyles: { id: ListStyle; name: string; icon: any }[] = [
    { id: 'minimal', name: 'Minimal', icon: AlignJustify },
    { id: 'bento', name: 'Bento', icon: Layers },
    { id: 'magazine', name: 'Magazine', icon: Grid },
    { id: 'compact', name: 'Compact', icon: List },
  ];

  const handleStyleSelect = (styleId: ListStyle) => {
    setActiveListStyle(styleId);
    updateSettings({ listStyle: styleId });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/80 backdrop-blur-md sticky top-0 z-10">
        <div className="h-14 flex items-center justify-between px-4">
          <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <h1 className="text-sm font-bold uppercase tracking-widest text-white">List Styles Preview</h1>
          
          <div className="w-10" />
        </div>

        {/* Sub-selector */}
        <div className="px-4 pb-3 flex justify-center">
          <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-xl border border-gray-800">
            {listStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleSelect(style.id as ListStyle)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 uppercase tracking-wider",
                  activeListStyle === style.id 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                <style.icon className="w-3 h-3" />
                <span>{style.name}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeListStyle}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            <div className="p-4 max-w-2xl mx-auto space-y-8 py-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Inbox Preview</h2>
                <div className="text-xs text-gray-500">Active Style: {activeListStyle}</div>
              </div>
              
              {activeListStyle === 'minimal' && <MinimalList items={SAMPLE_LIST} imageDisplay={settings.imageDisplay} />}
              {activeListStyle === 'bento' && <BentoList items={SAMPLE_LIST} imageDisplay={settings.imageDisplay} />}
              {activeListStyle === 'magazine' && <MagazineList items={SAMPLE_LIST} imageDisplay={settings.imageDisplay} />}
              {activeListStyle === 'compact' && <CompactList items={SAMPLE_LIST} imageDisplay={settings.imageDisplay} />}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const EditorialLayout = ({ article }: { article: any }) => (
  <article className="bg-[#121212] min-h-full text-[#e0e0e0] font-serif py-12 px-6">
    <div className="max-w-[65ch] mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-2 text-blue-400 font-sans text-sm font-medium mb-4 uppercase tracking-widest">
          <span>{article.author}</span>
          <span className="opacity-30">•</span>
          <span>{article.readTime}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
          {article.title}
        </h1>
        <div className="flex items-center gap-4 text-gray-500 font-sans text-sm border-y border-gray-800 py-4">
          <Clock className="w-4 h-4" />
          <span>{article.date}</span>
          <div className="flex-1" />
          <Share2 className="w-4 h-4" />
          <Bookmark className="w-4 h-4" />
        </div>
      </header>

      <img 
        src={article.imageUrl} 
        alt="" 
        className="w-full aspect-video object-cover rounded-sm mb-12 grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
        referrerPolicy="no-referrer"
      />

      <div 
        className="prose prose-invert prose-lg max-w-none leading-[1.8] text-gray-300
          first-letter:text-7xl first-letter:font-bold first-letter:text-white first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]
          [&>p]:mb-8 [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-white [&>blockquote]:text-2xl [&>blockquote]:my-12"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </div>
  </article>
);

const BentoLayout = ({ article }: { article: any }) => (
  <article className="bg-black min-h-full text-gray-200 font-sans p-4 sm:p-8">
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        <div className="md:col-span-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-tighter rounded-md border border-blue-500/20">
              {article.author}
            </span>
            <span className="text-gray-500 text-xs">{article.date}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4 tracking-tighter">
            {article.title}
          </h1>
        </div>
        <div className="md:col-span-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full">
            <Clock className="w-6 h-6 text-blue-500 mb-2" />
            <span className="text-2xl font-bold text-white">{article.readTime}</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Tempo di lettura</span>
          </div>
        </div>
      </div>

      <div className="relative group mb-12">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <img 
          src={article.imageUrl} 
          alt="" 
          className="relative w-full aspect-[21/9] object-cover rounded-2xl border border-gray-800"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="max-w-2xl mx-auto">
        <div 
          className="prose prose-invert prose-blue max-w-none text-gray-400
            [&>p]:mb-6 [&>p]:leading-relaxed
            [&>blockquote]:bg-gray-900/50 [&>blockquote]:p-8 [&>blockquote]:rounded-2xl [&>blockquote]:border-none [&>blockquote]:text-xl [&>blockquote]:font-medium [&>blockquote]:text-white [&>blockquote]:my-10"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </div>
  </article>
);

const GlassLayout = ({ article }: { article: any }) => (
  <article className="relative min-h-full font-sans overflow-hidden">
    {/* Animated Background Gradients */}
    <div className="absolute inset-0 z-0">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
    </div>

    <div className="relative z-10 py-4 px-0 sm:px-2">
      <div className="max-w-5xl mx-auto">
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl">
          <img 
            src={article.imageUrl} 
            alt="" 
            className="w-full aspect-video object-cover"
            referrerPolicy="no-referrer"
          />
          
          <div className="p-4 sm:p-8">
            <header className="mb-8 text-center">
              <span className="text-blue-400 text-sm font-semibold tracking-wide mb-3 block">
                {article.author.toUpperCase()}
              </span>
              <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4">
                {article.title}
              </h1>
              <div className="flex items-center justify-center gap-4 text-gray-400 text-sm">
                <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {article.readTime}</span>
                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                <span>{article.date}</span>
              </div>
            </header>

            <div 
              className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-base sm:text-lg
                [&>p]:mb-6
                [&>blockquote]:relative [&>blockquote]:border-none [&>blockquote]:p-0 [&>blockquote]:text-center [&>blockquote]:text-xl sm:text-2xl [&>blockquote]:font-light [&>blockquote]:text-blue-200 [&>blockquote]:my-10
                [&>blockquote]:before:content-['“'] [&>blockquote]:before:text-6xl [&>blockquote]:before:text-blue-500/30 [&>blockquote]:before:absolute [&>blockquote]:before:-top-8 [&>blockquote]:before:left-1/2 [&>blockquote]:before:-translate-x-1/2"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </div>
      </div>
    </div>
  </article>
);

const ZenLayout = ({ article }: { article: any }) => (
  <article className="bg-black min-h-full text-gray-400 font-mono py-20 px-6">
    <div className="max-w-[60ch] mx-auto">
      <header className="mb-20">
        <div className="text-[10px] uppercase tracking-[0.3em] text-gray-600 mb-8 flex justify-between">
          <span>{article.author}</span>
          <span>{article.date}</span>
        </div>
        <h1 className="text-3xl font-normal text-white leading-tight mb-4 lowercase">
          {article.title}
        </h1>
        <div className="h-px bg-gray-900 w-full my-8" />
      </header>

      <div 
        className="prose prose-invert prose-sm max-w-none leading-loose text-gray-500
          [&>p]:mb-10
          [&>p]:first-of-type:text-gray-300
          [&>blockquote]:border-none [&>blockquote]:pl-0 [&>blockquote]:text-gray-400 [&>blockquote]:text-lg [&>blockquote]:my-16 [&>blockquote]:text-center"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <footer className="mt-32 pt-8 border-t border-gray-900 text-[10px] text-gray-700 uppercase tracking-widest flex justify-between">
        <span>End of article</span>
        <span>{article.readTime} reading</span>
      </footer>
    </div>
  </article>
);

/* List Style Components */

const MinimalList = ({ items, imageDisplay }: { items: any[], imageDisplay: string }) => (
  <div className="divide-y divide-gray-800">
    {items.map(item => (
      <div key={item.id} className={cn(
        "py-4 flex gap-4 group cursor-pointer",
        imageDisplay === 'large' ? "flex-col" : "flex-row items-center"
      )}>
        {imageDisplay !== 'none' && (
          <img 
            src={item.image} 
            className={cn(
              "rounded-lg object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all flex-shrink-0",
              imageDisplay === 'large' ? "w-full h-auto" : "w-20 h-20"
            )} 
            alt="" 
            referrerPolicy="no-referrer" 
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{item.source}</span>
            <span className="text-[10px] text-gray-600">{item.date}</span>
          </div>
          <h3 className={cn("text-base font-medium leading-snug group-hover:text-blue-400 transition-colors", item.isRead ? "text-gray-500" : "text-white")}>
            {item.title}
          </h3>
        </div>
      </div>
    ))}
  </div>
);

const BentoList = ({ items, imageDisplay }: { items: any[], imageDisplay: string }) => (
  <div className="space-y-3">
    {items.map(item => (
      <div key={item.id} className={cn(
        "bg-gray-900/40 border border-gray-800 p-4 rounded-2xl flex gap-4 hover:bg-gray-800/60 transition-all group cursor-pointer",
        imageDisplay === 'large' ? "flex-col" : "flex-row items-center"
      )}>
        {imageDisplay !== 'none' && (
          <img 
            src={item.image} 
            className={cn(
              "rounded-xl object-cover flex-shrink-0",
              imageDisplay === 'large' ? "w-full h-auto" : "w-24 h-24"
            )} 
            alt="" 
            referrerPolicy="no-referrer" 
          />
        )}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </div>
            <span className="text-xs font-semibold text-gray-400">{item.source}</span>
          </div>
          <h3 className={cn("text-lg font-bold leading-tight", item.isRead ? "text-gray-500" : "text-white")}>
            {item.title}
          </h3>
          <span className="text-[10px] text-gray-600 mt-2 font-mono uppercase">{item.date}</span>
        </div>
      </div>
    ))}
  </div>
);

const MagazineList = ({ items, imageDisplay }: { items: any[], imageDisplay: string }) => (
  <div className="space-y-8">
    {items.map((item, idx) => (
      <div key={item.id} className={cn(
        "group cursor-pointer flex gap-4",
        imageDisplay === 'large' ? "flex-col" : "flex-row items-center"
      )}>
        {imageDisplay !== 'none' && (
          <div className={cn(
            "relative overflow-hidden flex-shrink-0",
            imageDisplay === 'large' ? "w-full h-auto rounded-3xl mb-4" : "w-20 h-20 rounded-lg"
          )}>
            <img 
              src={item.image} 
              className={cn(
                "w-full h-full object-cover group-hover:scale-105 transition-transform duration-700",
                imageDisplay === 'large' && "h-auto"
              )} 
              alt="" 
              referrerPolicy="no-referrer" 
            />
            {imageDisplay === 'large' && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10 flex items-center gap-1.5">
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${item.source.toLowerCase().replace(' ', '')}.com&sz=32`} 
                  className="w-3 h-3 rounded-sm" 
                  alt="" 
                />
                {item.source}
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {imageDisplay !== 'large' && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{item.source}</span>
              <span className="text-[10px] text-gray-600">{item.date}</span>
            </div>
          )}
          <h3 className={cn(
            "font-bold leading-tight mb-2", 
            imageDisplay === 'large' ? "text-2xl" : "text-base",
            item.isRead ? "text-gray-500" : "text-white"
          )}>
            {item.title}
          </h3>
          {imageDisplay === 'large' && (
            <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-snug">
              Questa è un'anteprima del contenuto dell'articolo per mostrare come appare lo snippet nel layout Magazine...
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {item.date}</span>
            <div className="flex-1" />
            <div className="flex gap-2">
              <Star className="w-4 h-4" />
              <Share2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const CompactList = ({ items, imageDisplay }: { items: any[], imageDisplay: string }) => (
  <div className="bg-gray-900/20 rounded-2xl border border-gray-800 overflow-hidden">
    {items.map((item, idx) => (
      <div key={item.id} className={cn(
        "p-3 flex items-center gap-3 hover:bg-gray-800/40 transition-colors cursor-pointer",
        idx !== items.length - 1 && "border-b border-gray-800/50",
        imageDisplay === 'large' && "flex-col items-start"
      )}>
        <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", item.isRead ? "bg-transparent" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]")} />
        {imageDisplay === 'large' && (
          <img src={item.image} className="w-full h-auto rounded-xl object-cover mb-2" alt="" referrerPolicy="no-referrer" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className={cn("text-sm font-medium truncate", item.isRead ? "text-gray-500" : "text-gray-200")}>
            {item.title}
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-gray-600 mt-0.5">
            <span className="font-bold text-gray-500">{item.source}</span>
            <span>•</span>
            <span>{item.date}</span>
          </div>
        </div>
        {imageDisplay === 'small' && (
          <img src={item.image} className="w-10 h-10 rounded-md object-cover opacity-60" alt="" referrerPolicy="no-referrer" />
        )}
      </div>
    ))}
  </div>
);
