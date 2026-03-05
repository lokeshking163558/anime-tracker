
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Brain, Loader2, Plus, Info, ChevronRight, Zap } from 'lucide-react';
import { getAnimeRecommendations, Recommendation } from '../services/geminiService';
import { WatchListEntry, Anime } from '../types';
import { CyberCard, CyberButton, GlitchText } from './CyberUI';
import { searchAnime } from '../services/jikanService';

interface NeuralAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: WatchListEntry[];
  onAddAnime: (anime: Anime, initialWatched: number) => void;
}

export const NeuralAdvisor: React.FC<NeuralAdvisorProps> = ({
  isOpen,
  onClose,
  watchlist,
  onAddAnime
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState('');
  const [addingAnime, setAddingAnime] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const titles = watchlist.map(e => e.title);
      const res = await getAnimeRecommendations(titles);
      setRecommendations(res);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Neural Network');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && recommendations.length === 0) {
      fetchRecommendations();
    }
  }, [isOpen]);

  const handleAddRecommended = async (rec: Recommendation) => {
    setAddingAnime(rec.title);
    try {
      const results = await searchAnime(rec.title);
      if (results.length > 0) {
        // Find the best match
        const bestMatch = results.find(a => a.title.toLowerCase() === rec.title.toLowerCase()) || results[0];
        onAddAnime(bestMatch, 0);
        // Remove from recommendations list
        setRecommendations(prev => prev.filter(r => r.title !== rec.title));
      } else {
        throw new Error('Anime not found in database');
      }
    } catch (err: any) {
      alert(`Failed to add: ${err.message}`);
    } finally {
      setAddingAnime(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-3xl max-h-[85vh] flex flex-col"
          >
            <CyberCard className="flex flex-col h-full overflow-hidden border-accent/40 shadow-[0_0_50px_rgba(0,255,159,0.1)]">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-accent/20 bg-accent/5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Brain className="w-8 h-8 text-accent animate-pulse" />
                    <Zap className="w-4 h-4 text-cyber-pink absolute -top-1 -right-1" />
                  </div>
                  <div>
                    <GlitchText className="text-2xl font-black uppercase tracking-tighter">
                      Neural_Advisor
                    </GlitchText>
                    <p className="text-[10px] font-mono text-accent/60 uppercase tracking-widest">AI_Powered_Recommendations</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-accent/10 text-gray-400 hover:text-accent transition-colors rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="relative mb-6">
                      <Loader2 className="w-16 h-16 animate-spin text-accent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-cyber-pink animate-pulse" />
                      </div>
                    </div>
                    <p className="font-mono text-lg uppercase tracking-[0.3em] text-accent animate-pulse">Scanning_Neural_Patterns...</p>
                    <p className="text-xs text-gray-500 mt-2 font-mono">Synthesizing taste profile from {watchlist.length} records</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-cyber-pink">
                    <Info className="w-16 h-16 mb-4 opacity-50" />
                    <p className="font-mono text-lg uppercase tracking-widest">Connection_Severed</p>
                    <p className="text-sm mt-2">{error}</p>
                    <CyberButton onClick={fetchRecommendations} className="mt-6" primary>
                      Retry_Link
                    </CyberButton>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Synthesized Recommendations:</p>
                      <button 
                        onClick={fetchRecommendations}
                        className="text-[10px] font-mono text-accent hover:underline uppercase"
                      >
                        Refresh_Neural_Link
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {recommendations.map((rec, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="group bg-black/40 border border-white/5 hover:border-accent/30 p-5 rounded-lg transition-all duration-300 relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                            <Sparkles className="w-12 h-12 text-accent" />
                          </div>
                          
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors flex items-center gap-2">
                                {rec.title}
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                              </h3>
                              <p className="text-sm text-gray-300 mt-2 leading-relaxed italic">
                                "{rec.description}"
                              </p>
                              <div className="mt-4 flex items-start gap-2 bg-accent/5 p-3 rounded border border-accent/10">
                                <Brain className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] font-mono text-accent/80 leading-tight">
                                  <span className="font-bold">ADVISOR_LOG:</span> {rec.reason}
                                </p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleAddRecommended(rec)}
                              disabled={addingAnime === rec.title}
                              className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded border transition-all ${
                                addingAnime === rec.title 
                                  ? 'bg-accent/20 border-accent text-accent' 
                                  : 'bg-white/5 border-white/10 hover:bg-accent hover:border-accent hover:text-black'
                              }`}
                              title="Add to Library"
                            >
                              {addingAnime === rec.title ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                              ) : (
                                <Plus className="w-6 h-6" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-accent/20 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="text-[9px] font-mono text-accent uppercase">Neural_Link_Stable</span>
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <span className="text-[9px] font-mono text-gray-500 uppercase">Gemini_3_Flash_Engine</span>
                </div>
                <p className="text-[9px] font-mono text-gray-600 uppercase">© 2026 ANITRACK_SYSTEMS</p>
              </div>
            </CyberCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
