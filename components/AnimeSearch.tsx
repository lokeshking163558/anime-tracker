import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Loader2, X, WifiOff, Hourglass, ServerCrash, AlertTriangle, CheckCircle } from 'lucide-react';
import { searchAnime } from '../services/jikanService';
import { Anime } from '../types';

interface AnimeSearchProps {
  onAddAnime: (anime: Anime, watched: number) => void;
}

export const AnimeSearch: React.FC<AnimeSearchProps> = ({ onAddAnime }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [watchedInput, setWatchedInput] = useState<string>('');

  // Click outside listener ref
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setLoading(true);
        setError(null);
        try {
          const data = await searchAnime(query);
          setResults(data);
          setShowResults(true);
        } catch (err: any) {
          setResults([]);
          setError(err.message || "Failed to fetch results");
          setShowResults(true);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
        setError(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInitiateAdd = (anime: Anime) => {
    setSelectedAnime(anime);
    setWatchedInput('0');
    setShowResults(false);
  };

  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnime) return;
    
    let watched = parseInt(watchedInput, 10);
    if (isNaN(watched) || watched < 0) watched = 0;
    
    // Cap at total episodes if known
    if (selectedAnime.episodes && watched > selectedAnime.episodes) {
      watched = selectedAnime.episodes;
    }

    onAddAnime(selectedAnime, watched);
    
    // Reset
    setSelectedAnime(null);
    setWatchedInput('');
    setQuery('');
  };

  // Helper to parse error string and return UI config
  const getErrorConfig = (msg: string) => {
    if (msg.includes("Network:")) {
      return { icon: WifiOff, text: msg.replace("Network:", "").trim(), color: "text-amber-500 dark:text-amber-400" };
    }
    if (msg.includes("RateLimit:")) {
      return { icon: Hourglass, text: msg.replace("RateLimit:", "").trim(), color: "text-orange-500 dark:text-orange-400" };
    }
    if (msg.includes("Server:")) {
      return { icon: ServerCrash, text: msg.replace("Server:", "").trim(), color: "text-red-500 dark:text-red-400" };
    }
    return { icon: AlertTriangle, text: msg.replace("Error:", "").trim(), color: "text-red-500 dark:text-red-400" };
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50" ref={searchContainerRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0 || error) setShowResults(true); }}
          placeholder="Search for an anime to track..."
          className={`w-full px-6 py-4 rounded-full glass-panel border shadow-xl focus:outline-none focus:ring-2 text-slate-700 dark:text-slate-100 placeholder-slate-400 ${error ? 'border-red-300 focus:ring-red-400' : 'border-sakura-200 dark:border-slate-700 focus:ring-sakura-400 dark:focus:ring-purple-500'}`}
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </div>
      </div>

      {showResults && (results.length > 0 || error) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-midnight-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-96 overflow-y-auto animate-fade-in z-50">
          
          {error ? (
            (() => {
              const { icon: Icon, text, color } = getErrorConfig(error);
              return (
                <div className={`p-6 flex flex-col items-center justify-center ${color} gap-3 text-center`}>
                  <Icon className="w-8 h-8 opacity-80" />
                  <span className="text-sm font-medium">{text}</span>
                </div>
              );
            })()
          ) : (
            results.map((anime) => (
              <div 
                key={anime.mal_id} 
                className="flex items-center p-3 hover:bg-sakura-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group border-b border-slate-100 dark:border-slate-800 last:border-0"
                onClick={() => handleInitiateAdd(anime)}
              >
                <img 
                  src={anime.images.jpg.image_url} 
                  alt={anime.title} 
                  className="w-12 h-16 object-cover rounded-md shadow-sm"
                />
                <div className="ml-4 flex-1">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-sakura-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                    {anime.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {anime.episodes ? `${anime.episodes} eps` : 'Ongoing'} • {anime.genres.slice(0, 2).map(g => g.name).join(', ')}
                  </p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInitiateAdd(anime);
                  }}
                  className="ml-3 px-3 py-1.5 bg-sakura-500 hover:bg-sakura-600 dark:bg-purple-600 dark:hover:bg-purple-500 text-white text-xs font-bold rounded-full shadow-md transition-transform transform active:scale-95 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Dialog Modal */}
      {selectedAnime && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 animate-slide-up">
            <div className="relative h-32 bg-slate-100 dark:bg-slate-800">
              <img 
                src={selectedAnime.images.jpg.large_image_url} 
                alt="Banner" 
                className="w-full h-full object-cover opacity-60 mask-image-gradient"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 to-transparent" />
              <button 
                onClick={() => setSelectedAnime(null)}
                className="absolute top-3 right-3 p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleConfirmAdd} className="p-6 pt-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1 line-clamp-1">
                {selectedAnime.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                How much have you watched?
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Episodes Watched
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="0"
                      max={selectedAnime.episodes || 9999}
                      value={watchedInput}
                      onChange={(e) => setWatchedInput(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sakura-400 focus:outline-none text-slate-800 dark:text-white font-mono text-lg"
                      autoFocus
                    />
                    <div className="text-sm text-slate-400">
                       / {selectedAnime.episodes || '?'}
                    </div>
                  </div>
                  
                  {/* Completed Shortcut Button */}
                  {selectedAnime.episodes && (
                    <button
                      type="button"
                      onClick={() => setWatchedInput(selectedAnime.episodes?.toString() || '')}
                      className="mt-2 text-xs flex items-center gap-1 text-sakura-600 dark:text-purple-400 hover:underline"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Set to Completed ({selectedAnime.episodes})
                    </button>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedAnime(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl bg-sakura-500 hover:bg-sakura-600 dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-bold shadow-lg shadow-sakura-500/30 dark:shadow-purple-500/30 transition-all active:scale-95"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};