import React, { useState } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { WatchListEntry } from '../types';
import { GENRE_COLORS } from '../constants';

interface AnimeCardProps {
  entry: WatchListEntry;
  onUpdateEpisodes: (entry: WatchListEntry, newAmount: number) => void;
  onRemove: (id: string) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ entry, onUpdateEpisodes, onRemove }) => {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (delta: number) => {
    const newAmount = entry.watchedEpisodes + delta;
    if (newAmount < 0) return;
    if (entry.totalEpisodes && newAmount > entry.totalEpisodes) return;
    
    setLoading(true);
    await onUpdateEpisodes(entry, newAmount);
    setLoading(false);
  };

  const progress = entry.totalEpisodes 
    ? (entry.watchedEpisodes / entry.totalEpisodes) * 100 
    : 0;

  return (
    <div className="group glass-panel rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-white/40 dark:border-slate-700 relative animate-slide-up">
      <div className="relative aspect-[16/9] overflow-hidden">
        <img 
          src={entry.imageUrl} 
          alt={entry.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-0 left-0 p-4 w-full">
          <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md">
            {entry.title}
          </h3>
        </div>
        <button 
          onClick={() => onRemove(entry.id)}
          className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="flex flex-wrap gap-2 mb-3">
          {entry.genres.slice(0, 3).map((genre) => {
             const colorClass = GENRE_COLORS[genre] || GENRE_COLORS['Default'];
             return (
              <span key={genre} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                {genre}
              </span>
             );
          })}
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Progress
            </span>
            <span className="text-sm font-bold text-sakura-600 dark:text-purple-400">
              {entry.watchedEpisodes} <span className="text-slate-400 text-xs font-normal">/ {entry.totalEpisodes || '?'}</span>
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-sakura-400 to-sakura-600 dark:from-purple-500 dark:to-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${entry.totalEpisodes ? progress : 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => handleUpdate(-1)}
              disabled={loading || entry.watchedEpisodes <= 0}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400">
                {entry.watchedEpisodes * 24}m tracked
              </span>
              <span className="text-[9px] text-slate-300 dark:text-slate-600 font-mono mt-0.5 opacity-60">
                #{entry.animeId}
              </span>
            </div>
            <button
              onClick={() => handleUpdate(1)}
              disabled={loading || (entry.totalEpisodes !== null && entry.watchedEpisodes >= entry.totalEpisodes)}
              className="p-2 rounded-lg bg-sakura-100 hover:bg-sakura-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-sakura-600 dark:text-purple-300 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
