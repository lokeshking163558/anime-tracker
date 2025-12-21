
import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Activity, RefreshCw, Star, ChevronDown, ChevronUp, Database, UploadCloud, BookOpen, BookOpenCheck, Terminal, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WatchListEntry } from '../types';
import { GENRE_COLORS } from '../constants';

interface AnimeCardProps {
  entry: WatchListEntry;
  onUpdateEpisodes: (entry: WatchListEntry, newAmount: number) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onRemove: (id: string) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ entry, onUpdateEpisodes, onToggleFavorite, onRemove }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullSynopsis, setIsFullSynopsis] = useState(false);
  
  // Local optimistic state for instant feedback
  const [optimisticWatched, setOptimisticWatched] = useState(entry.watchedEpisodes);

  // Sync optimistic state with source of truth when it settles
  useEffect(() => {
    setOptimisticWatched(entry.watchedEpisodes);
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 800);
    return () => clearTimeout(timer);
  }, [entry.watchedEpisodes]);

  // Reset synopsis state when card collapses
  useEffect(() => {
    if (!isExpanded) {
      setIsFullSynopsis(false);
    }
  }, [isExpanded]);

  const handleUpdate = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    const newAmount = optimisticWatched + delta;
    if (newAmount < 0) return;
    if (entry.totalEpisodes !== null && newAmount > entry.totalEpisodes) return;
    
    setOptimisticWatched(newAmount);
    onUpdateEpisodes(entry, newAmount);
  };

  const handleMarkAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (entry.totalEpisodes === null) return;
    
    setOptimisticWatched(entry.totalEpisodes);
    onUpdateEpisodes(entry, entry.totalEpisodes);
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(entry.id, !!entry.isFavorite);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(entry.id);
  };

  const toggleSynopsis = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullSynopsis(!isFullSynopsis);
  };

  const progress = entry.totalEpisodes !== null 
    ? (optimisticWatched / entry.totalEpisodes) * 100 
    : 0;

  const hasLongSynopsis = entry.synopsis && entry.synopsis.length > 160;

  return (
    <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`group relative bg-[var(--card-bg)] border transition-all duration-500 flex flex-col h-fit cursor-pointer animate-slide-up overflow-hidden ${
          entry.pending ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-white/10 hover:border-accent'
        } ${isExpanded ? 'ring-1 ring-accent/30 shadow-[0_0_20px_var(--accent-dim)]' : ''}`}
        style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b border-white/10">
        <img 
          src={entry.imageUrl} 
          alt={entry.title} 
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${entry.pending ? 'grayscale opacity-60' : 'grayscale group-hover:grayscale-0'} ${isExpanded ? 'grayscale-0 scale-105' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-4 w-full">
            <h3 className={`font-mono font-bold text-lg leading-tight line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-colors ${entry.pending ? 'text-amber-500' : 'text-white'}`}>
                {entry.title}
            </h3>
            <div className={`h-[2px] mt-2 transition-all duration-500 ${entry.pending ? 'w-1/2 bg-amber-500 animate-pulse' : isExpanded ? 'w-full bg-accent' : 'w-10 bg-accent group-hover:w-full'}`} />
        </div>

        {/* Top Controls Overlay */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
             {entry.score && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-black/70 border border-accent/40 backdrop-blur-sm">
                   <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                   <span className="text-[10px] font-mono font-bold text-accent">{entry.score}</span>
                </div>
             )}
          </div>
          <div className="flex gap-1">
             <button 
                onClick={handleToggleFav}
                className={`p-1.5 backdrop-blur-sm transition-all rounded-sm ${entry.isFavorite ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' : 'bg-black/60 text-gray-500 hover:text-yellow-400 hover:bg-black'}`}
             >
                <Star className={`w-4 h-4 ${entry.isFavorite ? 'fill-yellow-400' : ''}`} />
             </button>
             <button onClick={handleRemove} className="p-1.5 bg-black/60 text-gray-500 hover:text-red-500 hover:bg-black transition-all backdrop-blur-sm rounded-sm"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        
        {/* Permanent Favorite Indicator if not hovered */}
        {entry.isFavorite && (
           <div className="absolute top-2 left-2 p-1.5 bg-yellow-400 text-black group-hover:opacity-0 transition-opacity z-[5]">
              <Star className="w-3 h-3 fill-black" />
           </div>
        )}

        {entry.pending && (
          <div className="absolute top-2 right-12 p-1.5 bg-amber-500/20 text-amber-500 backdrop-blur-sm flex items-center gap-1 font-mono text-[9px] border border-amber-500/50 z-10">
             <UploadCloud className="w-2.5 h-2.5 animate-bounce" />
             <span className="tracking-tighter">PENDING_SYNC</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col backdrop-blur-sm relative">
        <div className={`absolute inset-0 bg-accent/5 pointer-events-none transition-opacity duration-500 ${isUpdating && !entry.pending ? 'opacity-100' : 'opacity-0'}`} />
        
        <div className="flex flex-wrap gap-1 mb-4 relative z-10">
          {entry.genres.slice(0, 3).map((genre) => {
             const colorClass = GENRE_COLORS[genre] || GENRE_COLORS['Default'];
             return <span key={genre} className={`text-[9px] px-1.5 py-0.5 font-mono uppercase tracking-wider ${colorClass}`}>{genre}</span>;
          })}
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-end mb-2 font-mono text-xs">
            <span className={`transition-colors flex items-center gap-1 ${entry.pending ? 'text-amber-500/70' : 'text-gray-500 group-hover:text-accent'} ${isExpanded ? 'text-accent' : ''}`}>
               <Activity className="w-3 h-3" /> PROGRESS
            </span>
            <div className="flex items-center gap-2">
              {entry.totalEpisodes !== null && optimisticWatched < entry.totalEpisodes && (
                <button 
                  onClick={handleMarkAll}
                  className="text-[8px] px-1.5 py-0.5 border border-accent/40 text-accent hover:bg-accent hover:text-black transition-all uppercase flex items-center gap-1 font-bold group/allbtn"
                  title="Mark All Episodes Watched"
                >
                  <Check className="w-2.5 h-2.5" /> ALL
                </button>
              )}
              <span className={entry.pending ? 'text-amber-500' : 'text-[var(--text-color)]'}>
                {optimisticWatched} <span className="text-gray-500">/ {entry.totalEpisodes !== null ? entry.totalEpisodes : '?'}</span>
              </span>
            </div>
          </div>

          <div className={`w-full bg-gray-900/40 h-1.5 mb-4 border overflow-hidden rounded-sm transition-colors ${entry.pending ? 'border-amber-900/50' : 'border-gray-800'}`}>
            <div 
              className={`h-full relative transition-all duration-300 ease-out ${
                entry.pending 
                  ? 'bg-amber-600 shadow-[0_0_10px_#d97706]' 
                  : isUpdating 
                    ? 'bg-accent shadow-[0_0_20px_var(--accent-color)] brightness-125' 
                    : 'bg-accent shadow-[0_0_5px_var(--accent-dim)]'
              }`}
              style={{ width: `${entry.totalEpisodes !== null ? progress : 100}%` }}
            >
                {entry.pending && (
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]" 
                        style={{ backgroundSize: '200% 100%' }} />
                )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button onClick={(e) => handleUpdate(e, -1)} disabled={optimisticWatched <= 0} className="p-1.5 border border-gray-800 text-gray-500 hover:border-cyber-pink hover:text-cyber-pink transition-all disabled:opacity-30">
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center">
              <span className={`text-[10px] font-mono transition-colors ${entry.pending ? 'text-amber-500/50' : 'text-gray-500'}`}>
                {optimisticWatched * 24}m
              </span>
            </div>
            <button onClick={(e) => handleUpdate(e, 1)} disabled={entry.totalEpisodes !== null && optimisticWatched >= entry.totalEpisodes} className="p-1.5 border border-gray-800 text-gray-500 hover:border-accent hover:text-accent transition-all disabled:opacity-30">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div 
              key="expanded-details"
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              className="overflow-hidden mt-6 border-t border-white/10 pt-4"
            >
               <div className="flex items-center gap-2 mb-2 text-accent">
                 <Terminal className="w-3.5 h-3.5" />
                 <span className="text-[10px] font-mono font-bold tracking-widest uppercase">Memory_Extract</span>
               </div>
               
               {entry.synopsis ? (
                 <div className="space-y-3 relative">
                    <motion.div 
                      className="relative overflow-hidden transition-all duration-500"
                      initial={false}
                      animate={{ maxHeight: isFullSynopsis ? '1000px' : '4.5rem' }}
                    >
                      <p className="text-[11px] font-sans leading-relaxed text-gray-400 italic">
                        {entry.synopsis}
                      </p>
                      
                      {/* Gradient Mask for truncated state */}
                      <AnimatePresence>
                        {!isFullSynopsis && hasLongSynopsis && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--card-bg)] to-transparent pointer-events-none"
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                    
                    {hasLongSynopsis && (
                      <button 
                        onClick={toggleSynopsis}
                        className="group/synbtn flex items-center gap-1.5 text-[9px] font-mono text-accent hover:text-white transition-all uppercase tracking-widest border border-accent/20 px-2 py-1.5 bg-accent/5 hover:bg-accent/20 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover/synbtn:translate-x-0 transition-transform duration-300" />
                        <span className="relative z-10 flex items-center gap-1.5">
                          {isFullSynopsis ? (
                            <><BookOpenCheck className="w-3 h-3" /> [ COLLAPSE_LOG ]</>
                          ) : (
                            <><BookOpen className="w-3 h-3" /> [ DECRYPT_FULL_SYNOPSIS ]</>
                          )}
                        </span>
                      </button>
                    )}
                 </div>
               ) : (
                 <p className="text-[10px] font-mono text-gray-600 uppercase italic">No synopsis linked.</p>
               )}

               <div className="mt-6 flex justify-center">
                 <button className="text-[9px] font-mono text-gray-600 hover:text-accent transition-colors uppercase tracking-widest flex items-center gap-1 group/retract">
                   Click to Retract 
                   <ChevronUp className="w-3 h-3 group-hover/retract:-translate-y-0.5 transition-transform" />
                 </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="mt-2 flex justify-center group-hover:opacity-100 transition-opacity"
          >
            <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-accent animate-bounce" />
          </motion.div>
        )}
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
