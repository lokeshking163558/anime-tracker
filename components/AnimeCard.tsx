
import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Activity, RefreshCw, Star, ChevronDown, ChevronUp, Database, CloudUpload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WatchListEntry } from '../types';
import { GENRE_COLORS } from '../constants';

interface AnimeCardProps {
  entry: WatchListEntry;
  onUpdateEpisodes: (entry: WatchListEntry, newAmount: number) => void;
  onRemove: (id: string) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ entry, onUpdateEpisodes, onRemove }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Local optimistic state for instant feedback
  const [optimisticWatched, setOptimisticWatched] = useState(entry.watchedEpisodes);

  // Sync optimistic state with source of truth when it settles
  useEffect(() => {
    setOptimisticWatched(entry.watchedEpisodes);
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 800);
    return () => clearTimeout(timer);
  }, [entry.watchedEpisodes]);

  const handleUpdate = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    const newAmount = optimisticWatched + delta;
    if (newAmount < 0) return;
    if (entry.totalEpisodes && newAmount > entry.totalEpisodes) return;
    
    setOptimisticWatched(newAmount);
    onUpdateEpisodes(entry, newAmount);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(entry.id);
  };

  const progress = entry.totalEpisodes 
    ? (optimisticWatched / entry.totalEpisodes) * 100 
    : 0;

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

        {entry.score && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/70 border border-accent/40 backdrop-blur-sm">
             <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
             <span className="text-[10px] font-mono font-bold text-accent">{entry.score}</span>
          </div>
        )}

        <button onClick={handleRemove} className="absolute top-0 right-0 p-2 bg-black/60 text-gray-500 hover:text-red-500 hover:bg-black transition-colors backdrop-blur-sm z-10"><Trash2 className="w-4 h-4" /></button>
        
        {entry.pending && (
          <div className="absolute top-2 right-12 p-1.5 bg-amber-500/20 text-amber-500 backdrop-blur-sm flex items-center gap-1 font-mono text-[9px] border border-amber-500/50 z-10">
             <CloudUpload className="w-2.5 h-2.5 animate-bounce" />
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
            <span className={entry.pending ? 'text-amber-500' : 'text-[var(--text-color)]'}>
              {optimisticWatched} <span className="text-gray-500">/ {entry.totalEpisodes || '?'}</span>
            </span>
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
              style={{ width: `${entry.totalEpisodes ? progress : 100}%` }}
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

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-6 border-t border-white/10 pt-4">
               <div className="flex items-center gap-2 mb-2 text-accent">
                 <Database className="w-3.5 h-3.5" />
                 <span className="text-[10px] font-mono font-bold tracking-widest uppercase">Memory_Extract</span>
               </div>
               {entry.synopsis ? <p className="text-[11px] font-sans leading-relaxed text-gray-400 line-clamp-6 italic">{entry.synopsis}</p> : <p className="text-[10px] font-mono text-gray-600 uppercase italic">No synopsis linked.</p>}
               <div className="mt-4 flex justify-center">
                 <button className="text-[9px] font-mono text-gray-600 hover:text-accent transition-colors uppercase tracking-widest flex items-center gap-1">Click to Retract <ChevronUp className="w-3 h-3" /></button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!isExpanded && <div className="mt-2 flex justify-center opacity-0 group-hover:opacity-40 transition-opacity"><ChevronDown className="w-4 h-4 text-gray-500" /></div>}
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
