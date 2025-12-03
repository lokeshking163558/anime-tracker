import React, { useState, useMemo } from 'react';
import { WatchHistoryItem, WatchListEntry } from '../types';
import { X, Calendar, Edit2, Trash2, Check, XCircle, Terminal, Clock, AlertTriangle } from 'lucide-react';
import { CyberCard, CyberButton, GlitchText } from './CyberUI';

interface HistoryModalProps {
  history: WatchHistoryItem[];
  watchlist: WatchListEntry[];
  onClose: () => void;
  onUpdate: (id: string, data: Partial<WatchHistoryItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, watchlist, onClose, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDelta, setEditDelta] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [history]);

  const getAnimeTitle = (item: WatchHistoryItem) => {
    if (item.animeTitle) return item.animeTitle;
    const found = watchlist.find(w => w.animeId === item.animeId);
    return found ? found.title : `Unknown ID: ${item.animeId}`;
  };

  const handleStartEdit = (item: WatchHistoryItem) => {
    setEditingId(item.id || null);
    setEditDelta(item.episodesDelta.toString());
    const date = new Date(item.timestamp);
    const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setEditDate(localIso);
  };

  const handleSaveEdit = async (id: string) => {
    if (!id) return;
    const delta = parseInt(editDelta, 10);
    if (isNaN(delta)) return;

    setLoadingId(id);
    try {
      await onUpdate(id, {
        episodesDelta: delta,
        timestamp: new Date(editDate).toISOString()
      });
      setEditingId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (!window.confirm("CONFIRM DELETION: This action will permanently modify your local stats database.")) return;
    
    setLoadingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  const formatDisplayDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <CyberCard className="w-full max-w-3xl h-[80vh] flex flex-col p-0">
        
        {/* Header */}
        <div className="p-4 border-b border-[#00ff9f]/20 flex items-center justify-between bg-[#00ff9f]/5">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-[#00ff9f] animate-pulse" />
            <GlitchText className="font-mono text-lg font-bold text-white tracking-widest">
              SYSTEM_LOGS
            </GlitchText>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-[#ff0055] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-black/40">
          {sortedHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4 font-mono">
              <AlertTriangle className="w-12 h-12 opacity-20" />
              <p>NO DATA ENTRIES FOUND.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {sortedHistory.map((item) => (
                <div key={item.id} className="p-4 hover:bg-[#00ff9f]/5 transition-colors group">
                  {editingId === item.id ? (
                    // Edit Mode
                    <div className="flex flex-col gap-3 animate-fade-in bg-gray-900 border border-[#00ff9f]/30 p-4 relative">
                      <div className="absolute top-0 left-0 w-2 h-full bg-[#00ff9f]" />
                      
                      <p className="font-mono text-xs text-[#00ff9f]">EDITING RECORD: {item.id}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-gray-500 font-mono block mb-1">EPISODE DELTA</label>
                          <input
                            type="number"
                            value={editDelta}
                            onChange={(e) => setEditDelta(e.target.value)}
                            className="w-full bg-black border border-gray-700 text-white px-3 py-2 font-mono text-sm focus:border-[#00ff9f] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-mono block mb-1">TIMESTAMP</label>
                          <input
                            type="datetime-local"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full bg-black border border-gray-700 text-white px-3 py-2 font-mono text-sm focus:border-[#00ff9f] outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 border border-gray-600 text-gray-400 text-xs font-mono hover:bg-gray-800"
                        >
                          CANCEL
                        </button>
                        <button
                          onClick={() => handleSaveEdit(item.id!)}
                          disabled={loadingId === item.id}
                          className="px-3 py-1 bg-[#00ff9f]/20 border border-[#00ff9f] text-[#00ff9f] text-xs font-mono hover:bg-[#00ff9f] hover:text-black"
                        >
                          SAVE_CHANGES
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="flex items-center justify-between gap-4 font-mono">
                      <div className="flex items-center gap-4 flex-1 overflow-hidden">
                        <div className="flex flex-col items-center justify-center min-w-[3.5rem] text-center border-r border-gray-800 pr-4">
                          <span className={`text-xl font-bold ${item.episodesDelta > 0 ? 'text-[#00ff9f]' : 'text-[#ff0055]'}`}>
                            {item.episodesDelta > 0 ? '+' : ''}{item.episodesDelta}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-[#00ff9f] transition-colors uppercase">
                            {getAnimeTitle(item)}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                             <Clock className="w-3 h-3" />
                             <span>{formatDisplayDate(item.timestamp)}</span>
                             <span className="text-gray-700">|</span>
                             <span>ID: {item.animeId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                           onClick={() => handleStartEdit(item)}
                           className="p-2 text-gray-500 hover:text-[#00ff9f] hover:bg-[#00ff9f]/10 transition-colors"
                           title="Modify"
                         >
                           <Edit2 className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => handleDelete(item.id!)}
                           className="p-2 text-gray-500 hover:text-[#ff0055] hover:bg-[#ff0055]/10 transition-colors"
                           title="Purge"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer Status */}
        <div className="p-2 bg-black border-t border-gray-800 text-[10px] font-mono text-gray-600 flex justify-between px-4">
            <span>TOTAL RECORDS: {history.length}</span>
            <span>MEM_USAGE: LOW</span>
        </div>
      </CyberCard>
    </div>
  );
};