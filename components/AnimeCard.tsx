import React, { useState } from 'react';
import { Plus, Minus, Trash2, Activity } from 'lucide-react';
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
    <div 
        className="group relative bg-black border border-white/10 hover:border-[#00ff9f] transition-all duration-300 flex flex-col h-full animate-slide-up overflow-hidden"
        style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
    >
      {/* Image Section */}
      <div className="relative aspect-[16/9] overflow-hidden border-b border-white/10">
        <img 
          src={entry.imageUrl} 
          alt={entry.title} 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 p-4 w-full">
            <h3 className="text-white font-mono font-bold text-lg leading-tight line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {entry.title}
            </h3>
            <div className="h-[2px] w-10 bg-[#00ff9f] mt-2 group-hover:w-full transition-all duration-500" />
        </div>

        {/* Delete Button */}
        <button 
          onClick={() => onRemove(entry.id)}
          className="absolute top-0 right-0 p-2 bg-black/60 text-gray-500 hover:text-red-500 hover:bg-black transition-colors backdrop-blur-sm"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-black/40 backdrop-blur-sm">
        <div className="flex flex-wrap gap-1 mb-4">
          {entry.genres.slice(0, 3).map((genre) => {
             const colorClass = GENRE_COLORS[genre] || GENRE_COLORS['Default'];
             return (
              <span key={genre} className={`text-[9px] px-1.5 py-0.5 font-mono uppercase tracking-wider ${colorClass}`}>
                {genre}
              </span>
             );
          })}
        </div>

        <div>
          {/* Progress Info */}
          <div className="flex justify-between items-end mb-2 font-mono text-xs">
            <span className="text-gray-500 group-hover:text-[#00ff9f] transition-colors flex items-center gap-1">
               <Activity className="w-3 h-3" /> PROGRESS
            </span>
            <span className="text-white">
              {entry.watchedEpisodes} <span className="text-gray-600">/ {entry.totalEpisodes || '?'}</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-900 h-1.5 mb-4 border border-gray-800">
            <div 
              className="bg-[#00ff9f] h-full shadow-[0_0_10px_#00ff9f] transition-all duration-500 ease-out relative"
              style={{ width: `${entry.totalEpisodes ? progress : 100}%` }}
            >
                {/* Glitch effect on bar */}
                <div className="absolute top-0 right-0 h-full w-1 bg-white opacity-50 animate-pulse" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => handleUpdate(-1)}
              disabled={loading || entry.watchedEpisodes <= 0}
              className="p-1.5 border border-gray-800 text-gray-500 hover:border-[#ff0055] hover:text-[#ff0055] hover:shadow-[0_0_10px_#ff0055] transition-all disabled:opacity-30 disabled:hover:border-gray-800"
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-600 font-mono">
                {entry.watchedEpisodes * 24}m
              </span>
            </div>

            <button
              onClick={() => handleUpdate(1)}
              disabled={loading || (entry.totalEpisodes !== null && entry.watchedEpisodes >= entry.totalEpisodes)}
              className="p-1.5 border border-gray-800 text-gray-500 hover:border-[#00ff9f] hover:text-[#00ff9f] hover:shadow-[0_0_10px_#00ff9f] transition-all disabled:opacity-30 disabled:hover:border-gray-800"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};