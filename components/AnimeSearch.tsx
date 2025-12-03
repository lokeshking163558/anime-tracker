import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Loader2, X, WifiOff, Hourglass, ServerCrash, AlertTriangle, CheckCircle, Sparkles, Database } from 'lucide-react';
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
  
  // AI State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string>('');
  
  // Modal State
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [watchedInput, setWatchedInput] = useState<string>('');

  const searchContainerRef = useRef<HTMLDivElement>(null);

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
      setAiRecommendations("Sorry, I couldn't generate recommendations right now.");
    } finally {
      setAiLoading(false);
    }
  };

  const getErrorConfig = (msg: string) => {
    if (msg.includes("Network:")) return { icon: WifiOff, text: msg.replace("Network:", "").trim(), color: "text-amber-500" };
    if (msg.includes("RateLimit:")) return { icon: Hourglass, text: msg.replace("RateLimit:", "").trim(), color: "text-orange-500" };
    if (msg.includes("Server:")) return { icon: ServerCrash, text: msg.replace("Server:", "").trim(), color: "text-red-500" };
    return { icon: AlertTriangle, text: msg.replace("Error:", "").trim(), color: "text-red-500" };
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50" ref={searchContainerRef}>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <CyberInput
            label="Search Database"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0 || error) setShowResults(true); }}
            placeholder="Input anime title..."
          />
        </div>
        
        <button
          onClick={handleAiRecommend}
          className="h-[50px] px-4 bg-[#00baee]/10 border border-[#00baee] text-[#00baee] hover:bg-[#00baee] hover:text-black transition-all duration-300 mb-[1px]"
          title="AI Analysis"
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>

      {showResults && (results.length > 0 || error) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/20 overflow-hidden max-h-96 overflow-y-auto z-50 animate-fade-in custom-scrollbar"
             style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
        >
          {error ? (
            (() => {
              const { icon: Icon, text, color } = getErrorConfig(error);
              return (
                <div className={`p-6 flex flex-col items-center justify-center ${color} gap-3 text-center border-l-2 border-red-500`}>
                  <Icon className="w-8 h-8 opacity-80" />
                  <span className="font-mono text-sm">{text}</span>
                </div>
              );
            })()
          ) : (
            results.map((anime) => (
              <div 
                key={anime.mal_id} 
                className="flex items-center p-3 hover:bg-[#00ff9f]/10 cursor-pointer group border-b border-white/5 last:border-0 transition-colors"
                onClick={() => handleInitiateAdd(anime)}
              >
                <div className="relative">
                  <img 
                    src={anime.images.jpg.image_url} 
                    alt={anime.title} 
                    className="w-10 h-14 object-cover border border-white/20 group-hover:border-[#00ff9f] transition-colors"
                  />
                  <div className="absolute inset-0 bg-[#00ff9f]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="font-mono font-bold text-gray-200 group-hover:text-[#00ff9f] transition-colors line-clamp-1 uppercase tracking-tight">
                    {anime.title}
                  </h4>
                  <p className="text-[10px] font-mono text-gray-500 group-hover:text-gray-400">
                    <span className="text-[#00baee]">{anime.episodes ? `${anime.episodes} EPS` : 'ONGOING'}</span> // {anime.genres.slice(0, 2).map(g => g.name).join(', ')}
                  </p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleInitiateAdd(anime); }}
                  className="ml-3 p-2 border border-[#00ff9f]/50 text-[#00ff9f] hover:bg-[#00ff9f] hover:text-black transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))
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
               <div className="absolute bottom-2 left-4">
                  <h3 className="text-lg font-black font-mono text-white uppercase line-clamp-1 drop-shadow-md">
                    {selectedAnime.title}
                  </h3>
               </div>
               <button 
                onClick={() => setSelectedAnime(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500 transition-colors"
               >
                <X className="w-5 h-5" />
               </button>
            </div>
            
            <form onSubmit={handleConfirmAdd} className="p-4 pt-0 space-y-4">
              <p className="text-xs font-mono text-[#00ff9f] tracking-widest uppercase mb-1">
                &gt; Enter Existing Data
              </p>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase">
                  Progress Counter
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="0"
                    max={selectedAnime.episodes || 9999}
                    value={watchedInput}
                    onChange={(e) => setWatchedInput(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 bg-black border border-gray-700 text-[#00ff9f] px-4 py-2 font-mono text-xl focus:border-[#00ff9f] outline-none"
                    autoFocus
                  />
                  <div className="text-sm font-mono text-gray-600">
                     / {selectedAnime.episodes || '???'}
                  </div>
                </div>
                
                {selectedAnime.episodes && (
                  <button
                    type="button"
                    onClick={() => setWatchedInput(selectedAnime.episodes?.toString() || '')}
                    className="mt-2 text-[10px] font-mono flex items-center gap-1 text-[#ff0055] hover:text-white transition-colors uppercase tracking-wider"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Mark Completed
                  </button>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <CyberButton onClick={() => setSelectedAnime(null)} className="flex-1 text-xs">
                  Cancel
                </CyberButton>
                <CyberButton type="submit" primary className="flex-1 text-xs">
                  Confirm_Entry
                </CyberButton>
              </div>
            </form>
          </CyberCard>
        </div>
      )}

      {/* AI Recommendations Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <CyberCard className="w-full max-w-lg border-[#00baee]/50">
             <div className="bg-[#00baee]/10 p-4 border-b border-[#00baee]/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#00baee] animate-pulse" />
                  <GlitchText className="font-mono font-bold text-[#00baee] tracking-widest">
                    AI_ANALYSIS_MODULE
                  </GlitchText>
                </div>
                <button 
                  onClick={() => setShowAiModal(false)}
                  className="text-[#00baee] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>
             
             <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <Loader2 className="w-12 h-12 text-[#00baee] animate-spin" />
                    <p className="font-mono text-xs text-[#00baee] animate-pulse">PROCESSING NEURAL NETWORK...</p>
                  </div>
                ) : (
                  <div className="font-mono text-sm leading-relaxed text-gray-300">
                    <div className="mb-4 text-xs text-gray-500 border-l-2 border-[#00baee] pl-3">
                      INPUT: {watchlist.length} ENTRIES FOUND.<br/>
                      OUTPUT: GENERATING SUGGESTIONS...
                    </div>
                    <div className="space-y-4">
                      {aiRecommendations.split('\n').map((line, i) => (
                        <p key={i} className="hover:text-white transition-colors">{line}</p>
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
