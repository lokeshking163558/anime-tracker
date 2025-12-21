
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, Loader2, X, WifiOff, Hourglass, AlertTriangle, Sparkles, Database, BookmarkCheck, Filter, ChevronRight, RefreshCw } from 'lucide-react';
import { searchAnime } from '../services/jikanService';
import { getAnimeRecommendations } from '../services/geminiService';
import { Anime, WatchListEntry } from '../types';
import { CyberInput, CyberButton, CyberCard, GlitchText } from './CyberUI';

interface AnimeSearchProps {
  onAddAnime: (anime: Anime, watched: number) => void;
  watchlist: WatchListEntry[];
}

export const AnimeSearch: React.FC<AnimeSearchProps> = ({ onAddAnime, watchlist }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  const [retryCount, setRetryCount] = useState(0); // Used to trigger search manually
  
  // AI State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string>('');
  
  // Modal State
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [watchedInput, setWatchedInput] = useState<string>('');

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const performSearch = async (searchQuery: string) => {
    if (searchQuery.length <= 2) {
      setResults([]);
      setShowResults(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedGenre('ALL');
    
    try {
      const data = await searchAnime(searchQuery);
      setResults(data);
      setShowResults(true);
    } catch (err: any) {
      setResults([]);
      setError(err.message || "Failed to fetch results");
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2) {
        performSearch(query);
      } else {
        setResults([]);
        setShowResults(false);
        setError(null);
      }
    }, 300); // Tuned for better performance

    return () => clearTimeout(timer);
  }, [query, retryCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryCount(prev => prev + 1);
  };

  // Compute available genres and their counts from the raw search results
  const genreData = useMemo(() => {
    const counts: Record<string, number> = {};
    results.forEach(anime => {
      anime.genres.forEach(g => {
        counts[g.name] = (counts[g.name] || 0) + 1;
      });
    });
    
    const sortedGenres = Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));

    return [{ name: 'ALL', count: results.length }, ...sortedGenres];
  }, [results]);

  // Apply the selected genre filter to the search results
  const filteredResults = useMemo(() => {
    if (selectedGenre === 'ALL') return results;
    return results.filter(anime => 
      anime.genres.some(g => g.name === selectedGenre)
    );
  }, [results, selectedGenre]);

  const handleInitiateAdd = (anime: Anime) => {
    if (watchlist.some(w => w.animeId === anime.mal_id)) return;
    setSelectedAnime(anime);
    setWatchedInput('0');
    setShowResults(false);
  };

  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnime) return;
    
    let watched = parseInt(watchedInput, 10);
    if (isNaN(watched) || watched < 0) watched = 0;
    
    if (selectedAnime.episodes && watched > selectedAnime.episodes) {
      watched = selectedAnime.episodes;
    }

    onAddAnime(selectedAnime, watched);
    setSelectedAnime(null);
    setWatchedInput('');
    setQuery('');
  };

  const handleAiRecommend = async () => {
    setShowAiModal(true);
    setAiLoading(true);
    setAiRecommendations('');
    try {
      const titles = watchlist.map(w => w.title);
      const recs = await getAnimeRecommendations(titles);
      setAiRecommendations(recs);
    } catch (err) {
      setAiRecommendations("Neural link failed to generate suggestions.");
    } finally {
      setAiLoading(false);
    }
  };

  const getErrorConfig = (msg: string) => {
    if (msg.includes("Network:")) {
      return { 
        icon: WifiOff, 
        text: "OFFLINE_UPLINK", 
        subtext: "Check your neural connection settings.", 
        color: "text-amber-500", 
        borderColor: "border-amber-500/30",
        bgColor: "bg-amber-500/5"
      };
    }
    if (msg.includes("RateLimit:")) {
      return { 
        icon: Hourglass, 
        text: "CONGESTED_DATA_STREAM", 
        subtext: "External API is rate-limiting our requests.", 
        color: "text-orange-500", 
        borderColor: "border-orange-500/30",
        bgColor: "bg-orange-500/5"
      };
    }
    if (msg.includes("Server:")) {
      return { 
        icon: AlertTriangle, 
        text: "EXTERNAL_CORE_FAILURE", 
        subtext: "Jikan API server is currently unresponsive.", 
        color: "text-red-500", 
        borderColor: "border-red-500/30",
        bgColor: "bg-red-500/5"
      };
    }
    return { 
      icon: AlertTriangle, 
      text: "GENERAL_ACCESS_FAULT", 
      subtext: msg.replace("Error:", "").trim(), 
      color: "text-red-400", 
      borderColor: "border-red-500/20",
      bgColor: "bg-red-500/5"
    };
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50" ref={searchContainerRef}>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <CyberInput
            label="Database Query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0 || error) setShowResults(true); }}
            placeholder="Input title sequence..."
          />
        </div>
        
        <button
          onClick={handleAiRecommend}
          className="h-[50px] px-4 bg-accent/10 border border-accent/40 text-accent hover:bg-accent hover:text-black transition-all duration-300 mb-[1px] group relative overflow-hidden"
          title="Neural Recommendations"
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
        >
          <div className="absolute inset-0 bg-accent/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <div className="relative z-10">
            {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </div>
        </button>
      </div>

      {showResults && (results.length > 0 || error || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-2xl border border-white/20 overflow-hidden max-h-[500px] flex flex-col z-50 animate-fade-in shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
             style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
        >
          {loading ? (
            <div className="p-10 flex flex-col items-center gap-2 text-accent">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="font-mono text-[10px] uppercase tracking-widest">Querying Matrix...</span>
            </div>
          ) : error ? (
            (() => {
              const config = getErrorConfig(error);
              const Icon = config.icon;
              return (
                <div className={`p-8 flex flex-col items-center justify-center gap-4 text-center border-l-4 ${config.borderColor} ${config.bgColor}`}>
                  <div className={`p-3 border ${config.borderColor} rounded-full`}>
                    <Icon className={`w-8 h-8 ${config.color} opacity-80`} />
                  </div>
                  <div className="space-y-1">
                    <h5 className={`font-mono text-sm font-black uppercase tracking-[0.2em] ${config.color}`}>{config.text}</h5>
                    <p className="text-[10px] font-mono text-gray-500 uppercase">{config.subtext}</p>
                  </div>
                  <button 
                    onClick={handleRetry}
                    className={`mt-2 flex items-center gap-2 px-6 py-2 border font-mono text-[10px] uppercase tracking-widest transition-all hover:bg-white/10 ${config.borderColor} ${config.color}`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Execute_Retry
                  </button>
                </div>
              );
            })()
          ) : (
            <>
              {/* Refined Genre Filter Bar */}
              {results.length > 0 && (
                <div className="p-3 border-b border-white/10 bg-white/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1">
                    <div className="flex items-center gap-2">
                      <Filter className="w-3 h-3 text-accent" />
                      <span>Neural Filters</span>
                    </div>
                    <span className="opacity-40">{filteredResults.length} Results Found</span>
                  </div>
                  <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar mask-fade-right">
                    {genreData.map(genre => (
                      <button
                        key={genre.name}
                        onClick={() => setSelectedGenre(genre.name)}
                        className={`whitespace-nowrap px-3 py-1 text-[10px] font-mono uppercase transition-all flex items-center gap-2 border ${
                          selectedGenre === genre.name 
                            ? 'bg-accent/20 text-accent border-accent/50 shadow-[0_0_10px_var(--accent-dim)]' 
                            : 'text-gray-500 hover:text-gray-300 border-transparent hover:bg-white/5'
                        }`}
                        style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
                      >
                        {genre.name}
                        <span className={`text-[8px] opacity-40 ${selectedGenre === genre.name ? 'opacity-100' : ''}`}>[{genre.count}]</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtered Results List */}
              <div className="overflow-y-auto custom-scrollbar flex-1 max-h-96">
                {filteredResults.length === 0 ? (
                  <div className="p-10 text-center text-gray-600 font-mono text-xs uppercase tracking-widest flex flex-col items-center gap-3">
                    <Database className="w-8 h-8 opacity-10" />
                    <span>No results found in {selectedGenre} archive</span>
                  </div>
                ) : (
                  filteredResults.map((anime) => {
                    const isInLibrary = watchlist.some(w => w.animeId === anime.mal_id);
                    return (
                      <div 
                        key={anime.mal_id} 
                        className={`flex items-center p-3 cursor-pointer group border-b border-white/5 last:border-0 transition-all ${isInLibrary ? 'opacity-60 bg-white/5 cursor-default' : 'hover:bg-accent/10'}`}
                        onClick={() => handleInitiateAdd(anime)}
                      >
                        <div className="relative shrink-0">
                          <img 
                            src={anime.images.jpg.image_url} 
                            alt={anime.title} 
                            className={`w-12 h-16 object-cover border border-white/20 transition-all ${isInLibrary ? 'grayscale' : 'group-hover:border-accent group-hover:scale-105'}`}
                          />
                          {isInLibrary && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                              <BookmarkCheck className="w-6 h-6 text-accent" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <h4 className={`font-mono font-bold uppercase tracking-tight truncate transition-colors ${isInLibrary ? 'text-gray-500' : 'text-gray-200 group-hover:text-accent'}`}>
                            {anime.title}
                          </h4>
                          <div className="text-[10px] font-mono text-gray-500 flex items-center gap-2 mt-1">
                            <span className="text-accent/70">{anime.episodes ? `${anime.episodes} EPS` : 'ONGOING'}</span>
                            <span className="opacity-20">|</span>
                            <span className="truncate">{anime.genres.slice(0, 2).map(g => g.name).join(', ')}</span>
                          </div>
                        </div>
                        {isInLibrary ? (
                          <div className="shrink-0 flex items-center gap-1 text-[8px] font-mono text-accent/50 uppercase tracking-tighter border border-accent/20 px-2 py-1">
                            LINK_ACTIVE
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleInitiateAdd(anime); }}
                            className="ml-3 p-2 border border-accent/30 text-accent group-hover:bg-accent group-hover:text-black group-hover:border-accent transition-all duration-300"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Dialog Modal */}
      {selectedAnime && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <CyberCard className="w-full max-w-sm">
            <div className="relative h-32 bg-gray-900 border-b border-white/10 mb-4 overflow-hidden">
               <div className="absolute inset-0 bg-cover bg-center opacity-40 grayscale" style={{ backgroundImage: `url(${selectedAnime.images.jpg.large_image_url})` }} />
               <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
               <div className="absolute bottom-2 left-4 pr-10">
                  <h3 className="text-lg font-black font-mono text-white uppercase line-clamp-1 drop-shadow-md">{selectedAnime.title}</h3>
               </div>
               <button onClick={() => setSelectedAnime(null)} className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-gray-500 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleConfirmAdd} className="p-4 pt-0 space-y-4">
              <div className="flex items-center gap-2 text-accent mb-1">
                <ChevronRight className="w-4 h-4" />
                <p className="text-xs font-mono tracking-widest uppercase">Sync New Record</p>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase">Initial Progress (Episodes)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="0"
                    max={selectedAnime.episodes || 9999}
                    value={watchedInput}
                    onChange={(e) => setWatchedInput(e.target.value)}
                    className="flex-1 bg-black border border-gray-700 text-accent px-4 py-2 font-mono text-xl focus:border-accent outline-none transition-colors"
                    autoFocus
                  />
                  <div className="text-sm font-mono text-gray-600">/ {selectedAnime.episodes || '???'}</div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <CyberButton onClick={() => setSelectedAnime(null)} className="flex-1 text-[10px]">Abort</CyberButton>
                <CyberButton type="submit" primary className="flex-1 text-[10px]">Confirm_Link</CyberButton>
              </div>
            </form>
          </CyberCard>
        </div>
      )}

      {/* AI Recommendations Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <CyberCard className="w-full max-w-lg border-accent/50">
             <div className="bg-accent/10 p-4 border-b border-accent/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-accent animate-pulse" />
                  <GlitchText className="font-mono font-bold text-accent tracking-widest">NEURAL_ANALYSIS</GlitchText>
                </div>
                <button onClick={() => setShowAiModal(false)} className="text-accent hover:text-white transition-colors p-1"><X className="w-6 h-6" /></button>
             </div>
             
             <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-12 h-12 text-accent animate-spin" />
                    <p className="font-mono text-[10px] text-accent animate-pulse tracking-[0.3em]">EXTRACTING DATA FROM MATRIX...</p>
                  </div>
                ) : (
                  <div className="font-mono text-sm leading-relaxed text-gray-300">
                    <div className="mb-6 p-3 bg-accent/5 border-l-4 border-accent text-[10px] text-gray-400">
                      STATUS: {watchlist.length} ACTIVE_SOURCES DETECTED.<br/>
                      ENCRYPTION_LAYER: ALPHA_9<br/>
                      SYNC_DATE: {new Date().toLocaleDateString()}
                    </div>
                    <div className="space-y-6">
                      {aiRecommendations.split('\n').filter(l => l.trim()).map((line, i) => (
                        <div key={i} className="group flex gap-4 transition-all">
                          <div className="text-accent mt-1 font-bold opacity-30 group-hover:opacity-100">0{i+1}</div>
                          <p className="group-hover:text-accent transition-colors leading-relaxed">{line}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>
          </CyberCard>
        </div>
      )}
    </div>
  );
};
