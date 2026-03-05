
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ChevronRight, Play, Clock, AlertCircle } from 'lucide-react';
import { WatchListEntry } from '../types';
import { CyberCard, CyberButton, GlitchText } from './CyberUI';

interface PendingCatalogProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: WatchListEntry[];
  onUpdateEpisodes: (entry: WatchListEntry, newAmount: number) => void;
}

export const PendingCatalog: React.FC<PendingCatalogProps> = ({
  isOpen,
  onClose,
  watchlist,
  onUpdateEpisodes
}) => {
  const pendingAnime = watchlist.filter(
    anime => anime.totalEpisodes !== null && anime.watchedEpisodes < anime.totalEpisodes
  ).sort((a, b) => {
    const remainingA = (a.totalEpisodes || 0) - a.watchedEpisodes;
    const remainingB = (b.totalEpisodes || 0) - b.watchedEpisodes;
    return remainingA - remainingB;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl max-h-[85vh] flex flex-col"
          >
            <CyberCard className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-accent/20">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-accent" />
                  <GlitchText className="text-2xl font-black uppercase tracking-tighter">
                    Pending_Episodes
                  </GlitchText>
                  <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-mono border border-accent/30 rounded">
                    {pendingAnime.length} ACTIVE_LINKS
                  </span>
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
                {pendingAnime.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                    <CheckCircle2 className="w-16 h-16 mb-4 text-accent" />
                    <p className="font-mono text-lg uppercase tracking-widest">All_Neural_Links_Synchronized</p>
                    <p className="text-sm mt-2">No pending episodes found in your library.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {pendingAnime.map((anime) => {
                      const remaining = (anime.totalEpisodes || 0) - anime.watchedEpisodes;
                      const progress = ((anime.watchedEpisodes / (anime.totalEpisodes || 1)) * 100);

                      return (
                        <motion.div
                          key={anime.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="group relative bg-black/40 border border-white/5 hover:border-accent/30 transition-all duration-300 p-4 rounded-lg overflow-hidden"
                        >
                          {/* Progress Bar Background */}
                          <div className="absolute bottom-0 left-0 h-1 bg-accent/5 w-full" />
                          <motion.div 
                            className="absolute bottom-0 left-0 h-1 bg-accent shadow-[0_0_10px_var(--accent-color)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />

                          <div className="flex items-center gap-4 relative z-10">
                            {/* Image Thumbnail */}
                            <div className="w-16 h-20 flex-shrink-0 relative overflow-hidden rounded border border-white/10">
                              <img 
                                src={anime.imageUrl} 
                                alt={anime.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg truncate group-hover:text-accent transition-colors">
                                {anime.title}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs font-mono text-accent flex items-center gap-1">
                                  <Play className="w-3 h-3" /> {anime.watchedEpisodes} / {anime.totalEpisodes}
                                </span>
                                <span className="text-[10px] font-mono text-cyber-pink uppercase tracking-tighter flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> {remaining} Pending
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onUpdateEpisodes(anime, anime.watchedEpisodes + 1)}
                                className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent text-accent hover:text-black font-mono text-xs font-bold uppercase tracking-wider transition-all rounded border border-accent/20"
                              >
                                <span>Watch_Next</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-accent/20 bg-black/20">
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                  <span>System_Status: Operational</span>
                  <span>Neural_Link_Active</span>
                </div>
              </div>
            </CyberCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
