import React, { useState, useRef, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import * as XLSX from 'xlsx';
import { auth, storage, db } from '../firebase';
import { UserStats, ThemeSettings, WatchListEntry } from '../types';
import { formatMinutes } from '../services/statsService';
import { X, User as UserIcon, Save, Key, AlertCircle, CheckCircle, Database, Camera, Loader2, Zap, ShieldCheck, Palette, Moon, Sun, Monitor, Paintbrush, FileDown, Share2, Upload, FileJson, FileSpreadsheet } from 'lucide-react';
import { CyberButton, CyberInput, CyberCard, GlitchText } from './CyberUI';

interface UserProfileProps {
  user: firebase.User;
  stats: UserStats;
  watchlist: WatchListEntry[];
  themeSettings: ThemeSettings | null;
  onClose: () => void;
}

const ACCENT_PRESETS = [
  { name: 'Emerald', color: '#00ff9f' },
  { name: 'Rose', color: '#ff0055' },
  { name: 'Cyan', color: '#00baee' },
  { name: 'Amethyst', color: '#bc13fe' },
  { name: 'Amber', color: '#ffb000' }
];

export const UserProfile: React.FC<UserProfileProps> = ({ user, stats, watchlist, themeSettings, onClose }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [currentMode, setCurrentMode] = useState<'dark' | 'light'>(themeSettings?.mode || 'dark');
  const [currentAccent, setCurrentAccent] = useState(themeSettings?.accentColor || '#00ff9f');

  useEffect(() => {
    if (themeSettings) {
      setCurrentMode(themeSettings.mode);
      setCurrentAccent(themeSettings.accentColor);
    }
  }, [themeSettings]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await user.updateProfile({ displayName });
      setMessage({ type: 'success', text: 'IDENTITY_RECORD UPDATED' });
    } catch (error: any) {
      setMessage({ type: 'error', text: `SYNC_FAILED: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTheme = async (mode: 'dark' | 'light', colorObj: {name: string, color: string}) => {
    setLoading(true);
    try {
      await db.collection('users').doc(user.uid).set({
        theme: {
          mode,
          accentColor: colorObj.color,
          accentName: colorObj.name
        }
      }, { merge: true });
      setMessage({ type: 'success', text: 'NEURAL_THEME_LINKED' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: `THEME_SYNC_FAILED: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user.email) return;
    setLoading(true);
    setMessage(null);
    try {
        await auth.sendPasswordResetEmail(user.email);
        setMessage({ type: 'success', text: 'RESET_PROTOCOL INITIATED. CHECK INBOX.' });
    } catch (error: any) {
        setMessage({ type: 'error', text: error.message });
    } finally {
        setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'INVALID FORMAT. IMAGE REQUIRED.' });
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'PAYLOAD TOO LARGE. MAX 5MB.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setMessage({ type: 'error', text: 'READ_ERROR: FAILED TO PROCESS IMAGE.' });
        setUploading(false);
        return;
      }

      try {
          const fileExtension = file.name.split('.').pop() || 'jpg';
          const storagePath = `avatars/${user.uid}/${Date.now()}.${fileExtension}`;
          const storageRef = storage.ref().child(storagePath);
          const snapshot = await storageRef.putString(dataUrl, 'data_url');
          const photoURL = await snapshot.ref.getDownloadURL();
          await user.updateProfile({ photoURL });
          await user.reload(); 
          setMessage({ type: 'success', text: 'AVATAR SYNCED TO SECURE_STORAGE.' });
      } catch (error: any) {
          setMessage({ type: 'error', text: `UPLINK_FAILED: ${error.message}` });
      } finally {
          setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const exportToCSV = () => {
    if (watchlist.length === 0) {
      setMessage({ type: 'error', text: 'EXPORT_FAILED: MEMORY BANK IS EMPTY.' });
      return;
    }

    // Comprehensive Headers for full restore capability
    const headers = [
        "MAL_ID", 
        "Title", 
        "ImageURL", 
        "Episodes Watched", 
        "Total Episodes", 
        "Genres", 
        "Score", 
        "Synopsis", 
        "IsFavorite"
    ];
    
    const rows = watchlist.map(entry => {
      const fields = [
        entry.animeId,
        `"${entry.title.replace(/"/g, '""')}"`,
        `"${entry.imageUrl}"`,
        entry.watchedEpisodes,
        entry.totalEpisodes || "",
        `"${entry.genres.join(';').replace(/"/g, '""')}"`,
        entry.score || "",
        `"${(entry.synopsis || "").replace(/"/g, '""')}"`,
        entry.isFavorite ? "TRUE" : "FALSE"
      ];
      return fields.join(",");
    });

    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `anitrack_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setMessage({ type: 'success', text: 'DATA_EXPORT_SUCCESSFUL: ARCHIVE CREATED' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file extension (CSV or Excel)
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    if (!validExtensions.some(ext => file.name.endsWith(ext))) {
        setMessage({ type: 'error', text: 'INVALID_PROTOCOL: ONLY .CSV OR .XLSX FILES SUPPORTED' });
        return;
    }

    setLoading(true);
    setMessage({ type: 'success', text: 'DECRYPTING_FILE_STREAM...' });

    const reader = new FileReader();
    
    reader.onload = async (event) => {
        const data = event.target?.result;
        if (!data) return;

        try {
            // Read binary data using SheetJS
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Assume data is in the first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert sheet to JSON array
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) throw new Error("FILE_EMPTY_OR_UNREADABLE");

            const batch = db.batch();
            const watchlistRef = db.collection('users').doc(user.uid).collection('watchlist');
            const historyRef = db.collection('users').doc(user.uid).collection('history');
            
            let importCount = 0;
            const BATCH_LIMIT = 400; // Safeguard Firestore limits

            for (const row of jsonData) {
                if (importCount >= BATCH_LIMIT) break;

                // Normalize Keys (Handle Case Sensitivity and Variations)
                // We create a normalized object to lookup values regardless of case
                const normalizedRow: any = {};
                Object.keys(row).forEach(key => {
                    normalizedRow[key.toLowerCase().trim()] = row[key];
                });

                // Extract Fields with fallbacks for different header names
                const mal_id = normalizedRow['mal_id'] || normalizedRow['id'] || normalizedRow['anime_id'];
                const title = normalizedRow['title'] || normalizedRow['name'] || normalizedRow['anime'];
                
                if (!mal_id || !title) continue; // Skip invalid rows

                const animeId = parseInt(mal_id);
                // Skip if already in library
                if (watchlist.some(w => w.animeId === animeId)) continue;

                // Parse other fields
                const imageUrl = normalizedRow['imageurl'] || normalizedRow['image'] || normalizedRow['poster'] || "";
                const watched = parseInt(normalizedRow['episodes watched'] || normalizedRow['watched'] || normalizedRow['completed'] || "0");
                const total = parseInt(normalizedRow['total episodes'] || normalizedRow['total'] || normalizedRow['episodes'] || "0");
                
                let genreArray: string[] = [];
                const rawGenres = normalizedRow['genres'] || normalizedRow['genre'] || "";
                if (typeof rawGenres === 'string') {
                    // Handle comma or semicolon separated genres
                    genreArray = rawGenres.split(/[;,]/).map((g: string) => g.trim());
                }

                const score = parseFloat(normalizedRow['score'] || normalizedRow['rating'] || "0") || null;
                const synopsis = normalizedRow['synopsis'] || normalizedRow['summary'] || null;
                
                // Handle Boolean for favorites (Excel might use TRUE/FALSE, 1/0, "TRUE"/"FALSE")
                let isFav = false;
                const rawFav = normalizedRow['isfavorite'] || normalizedRow['favorite'];
                if (rawFav === true || rawFav === 'TRUE' || rawFav === 1) isFav = true;

                // Create Firestore Refs
                const docRef = watchlistRef.doc();
                
                batch.set(docRef, {
                    animeId: animeId,
                    title: title,
                    imageUrl: imageUrl,
                    watchedEpisodes: isNaN(watched) ? 0 : watched,
                    totalEpisodes: isNaN(total) || total === 0 ? null : total,
                    genres: genreArray,
                    score: score,
                    synopsis: synopsis,
                    isFavorite: isFav,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Add History Entry if watched > 0
                if (watched > 0) {
                    const hRef = historyRef.doc();
                    batch.set(hRef, {
                        animeId: animeId,
                        animeTitle: title,
                        episodesDelta: watched,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                
                importCount++;
            }

            if (importCount > 0) {
                await batch.commit();
                setMessage({ type: 'success', text: `NEURAL_INJECTION_COMPLETE: ${importCount} NEW NODES LINKED` });
            } else {
                setMessage({ type: 'error', text: "DATA_REDUNDANT: NO NEW RECORDS FOUND" });
            }

        } catch (err: any) {
            console.error(err);
            setMessage({ type: 'error', text: `CORRUPT_DATA_STREAM: ${err.message}` });
        } finally {
            setLoading(false);
            if (importInputRef.current) importInputRef.current.value = "";
        }
    };

    reader.readAsArrayBuffer(file);
  };

  const joinDate = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : 'UNKNOWN';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <CyberCard className="w-full max-w-lg my-auto shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        <div className="flex items-center justify-between mb-8 border-b border-accent/20 pb-4">
          <div className="flex items-center gap-3">
             <Database className="w-5 h-5 text-cyber-pink animate-pulse" />
             <GlitchText className="text-xl font-mono font-bold tracking-widest">
                IDENTITY_MODULE
             </GlitchText>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-cyber-pink transition-colors p-1"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="flex flex-col items-center justify-center">
                <div className="relative w-28 h-28 mb-4 group">
                    <div className={`absolute inset-0 border-2 rounded-full transition-all duration-700 ${uploading ? 'border-cyber-pink animate-spin' : 'border-accent border-dashed animate-spin-slow opacity-50'}`}></div>
                    <div className="absolute inset-2 bg-gray-900 rounded-full overflow-hidden border border-gray-700 flex items-center justify-center shadow-inner">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                        ) : (
                            <UserIcon className="w-12 h-12 text-gray-500 group-hover:text-accent transition-colors" />
                        )}
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full cursor-pointer z-10"
                    >
                        {uploading ? <Loader2 className="w-8 h-8 text-accent animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                </div>
                <div className="text-center">
                    <div className="text-[10px] font-mono text-accent flex items-center gap-1 justify-center font-bold">
                      <ShieldCheck className="w-2.5 h-2.5" /> SECURE_VAULT_ACTIVE
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 mt-1 uppercase tracking-widest opacity-60">UID: {user.uid.substring(0,8)}</div>
                </div>
            </div>

            <div className="flex-1 space-y-4">
                <div className="p-3 border border-accent/10 bg-accent/5 rounded-sm">
                   <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Designation</label>
                   <div className="font-bold text-lg">{user.displayName || 'ANONYMOUS_RUNNER'}</div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Uplink Address</label>
                    <div className="font-mono text-sm opacity-80">{user.email}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Initialized At</label>
                    <div className="font-mono text-sm opacity-80">{joinDate}</div>
                  </div>
                </div>
            </div>
        </div>

        <div className="mb-8 p-6 bg-accent/5 border border-accent/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10"><Monitor className="w-12 h-12" /></div>
          <div className="flex items-center gap-2 mb-6 border-b border-accent/10 pb-2">
            <Palette className="w-4 h-4 text-accent" />
            <h4 className="text-xs font-mono font-bold text-accent uppercase tracking-[0.2em]">Neural Theme Configuration</h4>
          </div>
          
          <div className="space-y-8">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-2 tracking-widest">
                <Sun className="w-3 h-3" /> Visual_Atmosphere
              </span>
              <div className="flex bg-black/40 p-1 border border-gray-800 gap-1 rounded-sm w-fit">
                 <button 
                  onClick={() => handleSaveTheme('dark', ACCENT_PRESETS.find(p => p.color === currentAccent) || ACCENT_PRESETS[0])}
                  className={`flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase transition-all ${currentMode === 'dark' ? 'bg-accent/20 text-accent border border-accent/50' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                   <Moon className="w-3 h-3" /> Dark_Net
                 </button>
                 <button 
                  onClick={() => handleSaveTheme('light', ACCENT_PRESETS.find(p => p.color === currentAccent) || ACCENT_PRESETS[0])}
                  className={`flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase transition-all ${currentMode === 'light' ? 'bg-accent/20 text-accent border border-accent/50' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                   <Sun className="w-3 h-3" /> Day_Light
                 </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-2 tracking-widest">
                <Paintbrush className="w-3 h-3" /> Sync_Accent_Uplink
              </span>
              <div className="flex flex-wrap gap-3">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleSaveTheme(currentMode, preset)}
                    className={`relative group flex flex-col items-center gap-2 transition-transform hover:scale-110`}
                    title={preset.name}
                  >
                    <div 
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        currentAccent === preset.color 
                          ? 'border-white ring-4 ring-white/10 scale-110 shadow-[0_0_15px_var(--accent-dim)]' 
                          : 'border-transparent group-hover:border-white/50'
                      }`}
                      style={{ backgroundColor: preset.color }}
                    />
                    <span className={`text-[8px] font-mono uppercase tracking-tighter transition-colors ${currentAccent === preset.color ? 'text-accent' : 'text-gray-600'}`}>
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="mb-8 p-6 bg-cyber-pink/5 border border-cyber-pink/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><Share2 className="w-12 h-12 text-cyber-pink" /></div>
            <div className="flex items-center gap-2 mb-6 border-b border-cyber-pink/10 pb-2">
                <Database className="w-4 h-4 text-cyber-pink" />
                <h4 className="text-xs font-mono font-bold text-cyber-pink uppercase tracking-[0.2em]">Neural Portability</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <p className="text-[9px] font-mono text-gray-500 leading-relaxed uppercase">Export your memory bank to a portable CSV for external archive.</p>
                    <CyberButton onClick={exportToCSV} className="w-full text-[10px] flex items-center justify-center gap-2">
                        <FileDown className="w-4 h-4" /> EXPORT_DATA
                    </CyberButton>
                </div>
                <div className="space-y-2">
                    <p className="text-[9px] font-mono text-gray-500 leading-relaxed uppercase">Inject external CSV/Excel data directly into the neural network.</p>
                    <CyberButton 
                      onClick={() => importInputRef.current?.click()} 
                      disabled={loading}
                      className="w-full text-[10px] flex items-center justify-center gap-2 border-cyber-pink/30 hover:border-cyber-pink text-gray-300 hover:text-cyber-pink"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 
                        IMPORT_CORE
                    </CyberButton>
                    <input type="file" ref={importInputRef} onChange={handleImportData} className="hidden" accept=".csv, .xlsx, .xls" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-8">
           {[
             { label: "ENTRIES", value: watchlist.length, color: "text-accent" },
             { label: "HOURS", value: formatMinutes(stats.lifetimeMinutes).split(' ')[0], color: "text-cyber-pink" },
             { label: "EPISODES", value: Math.floor(stats.lifetimeMinutes / 24), color: "text-blue-400" }
           ].map((stat, i) => (
             <div key={i} className="bg-white/5 border border-white/10 p-3 text-center transition-all hover:bg-white/10 hover:border-accent/30 group">
                <div className={`text-2xl font-black font-mono tracking-tighter group-hover:scale-110 transition-transform ${stat.color}`}>{stat.value}</div>
                <div className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mt-1">{stat.label}</div>
             </div>
           ))}
        </div>

        <div className="border-t border-gray-800 pt-8 space-y-6">
            {message && (
              <div className={`p-4 border font-mono text-xs flex items-center gap-3 animate-fade-in ${
                  message.type === 'success' 
                  ? 'bg-green-900/10 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                  : 'bg-red-900/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,44,44,0.1)]'
              }`}>
                  {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-500"/> : <AlertCircle className="w-4 h-4 text-red-500"/>}
                  <span className="flex-1 text-[10px] tracking-tight">{message.text}</span>
                  <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
               <div className="flex gap-4 items-end">
                  <div className="flex-1">
                     <CyberInput 
                       label="Update Alias"
                       value={displayName}
                       onChange={(e) => setDisplayName(e.target.value)}
                       placeholder="Input new designation..."
                     />
                  </div>
                  <CyberButton type="submit" primary disabled={loading || uploading} className="h-[52px]">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </CyberButton>
               </div>
            </form>

            {user.providerData.some(p => p?.providerId === 'password') && (
               <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <CyberButton onClick={handlePasswordReset} className="text-[10px] w-full" disabled={loading || uploading}>
                    <Key className="w-3 h-3" />
                    Reset Access Key
                 </CyberButton>
                 <div className="flex items-center justify-center font-mono text-[9px] text-gray-600 uppercase tracking-widest px-4 border border-gray-800 opacity-50">
                    <Zap className="w-2 h-2 mr-2" /> Encrypted Link Active
                 </div>
               </div>
            )}
        </div>
      </CyberCard>
    </div>
  );
};