
import React, { useState, useEffect, useMemo, useRef } from 'react';
import firebase from 'firebase/compat/app';
import { auth, db, googleProvider } from './firebase';
import { Anime, WatchListEntry, WatchHistoryItem, ThemeSettings } from './types';
import { calculateStats } from './services/statsService';
import { AnimeSearch } from './components/AnimeSearch';
import { AnimeCard } from './components/AnimeCard';
import { StatsBoard } from './components/StatsBoard';
import { UserProfile } from './components/UserProfile';
import { HistoryModal } from './components/HistoryModal';
import { HomePage } from './components/HomePage';
import { CyberBackground, CyberButton, CyberInput, CyberCard, GlitchText } from './components/CyberUI';
import { Logo } from './components/Logo';
import { AmbientSound } from './components/AmbientSound';
import { Loader2, LogOut, History, ArrowLeft, Ghost, Wifi, AlertTriangle, X, CloudOff, Cloud, RefreshCw, UserCheck, Zap, Palette, UploadCloud } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<WatchListEntry[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [sortType, setSortType] = useState<'updated' | 'title'>('updated');
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);
  const [pendingOpsCount, setPendingOpsCount] = useState(0);
  
  // Auth Form State
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Debounce and Sync Refs
  const syncQueue = useRef<Record<string, { timer: ReturnType<typeof setTimeout>, delta: number, initialWatched: number }>>({});

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (themeSettings) {
      root.style.setProperty('--accent-color', themeSettings.accentColor);
      try {
        const hex = themeSettings.accentColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        root.style.setProperty('--accent-dim', `rgba(${r}, ${g}, ${b}, 0.2)`);
      } catch (e) {
        root.style.setProperty('--accent-dim', `rgba(0, 255, 159, 0.2)`);
      }

      if (themeSettings.mode === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
      }
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.setProperty('--accent-color', '#00ff9f');
      root.style.setProperty('--accent-dim', 'rgba(0, 255, 159, 0.2)');
    }
  }, [themeSettings]);

  // Network Listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setShowAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Theme Listener
  useEffect(() => {
    if (!user) return;
    const unsub = db.collection('users').doc(user.uid).onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data?.theme) {
          setThemeSettings(data.theme);
        }
      }
    });
    return () => unsub();
  }, [user]);

  const formatFirestoreDate = (val: any): string => {
    if (!val) return new Date().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    return val;
  };

  const syncData = async () => {
    if (!user) return;
    setIsSyncing(true);
    setError('');

    try {
      const watchlistRef = db.collection('users').doc(user.uid).collection('watchlist');
      const historyRef = db.collection('users').doc(user.uid).collection('history');
      
      const [wSnap, hSnap] = await Promise.all([
        watchlistRef.get({ source: 'server' }),
        historyRef.get({ source: 'server' })
      ]);
      
      const wList = wSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        updatedAt: formatFirestoreDate(doc.get('updatedAt'))
      })) as WatchListEntry[];
      
      const hList = hSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        timestamp: formatFirestoreDate(doc.get('timestamp'))
      })) as WatchHistoryItem[];
      
      setWatchlist(wList);
      setHistory(hList);
      setLastSyncTime(new Date());
    } catch (err: any) {
      setError("SYNC_LINK_TIMEOUT: Retrying with local cache.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      setHistory([]);
      return;
    }

    const userRef = db.collection('users').doc(user.uid);
    
    const unsubWatchlist = userRef.collection('watchlist').onSnapshot({ includeMetadataChanges: true }, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          updatedAt: formatFirestoreDate(data.updatedAt),
          pending: doc.metadata.hasPendingWrites
        };
      }) as WatchListEntry[];
      
      setWatchlist(list);
      setHasPendingWrites(snapshot.metadata.hasPendingWrites);
      if (!snapshot.metadata.hasPendingWrites) {
        setLastSyncTime(new Date());
      }
    });

    const unsubHistory = userRef.collection('history').onSnapshot((snapshot) => {
      const hist = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: formatFirestoreDate(data.timestamp)
        };
      }) as WatchHistoryItem[];
      setHistory(hist);
    });

    const unsubSync = db.onSnapshotsInSync(() => {
      setHasPendingWrites(false);
    });

    return () => {
      unsubWatchlist();
      unsubHistory();
      unsubSync();
    };
  }, [user]);

  const sortedWatchlist = useMemo(() => {
    const data = [...watchlist];
    if (sortType === 'updated') {
      return data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      return data.sort((a, b) => a.title.localeCompare(b.title));
    }
  }, [watchlist, sortType]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      if (isSignUp) {
        await auth.createUserWithEmailAndPassword(email, password);
      } else {
        await auth.signInWithEmailAndPassword(email, password);
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setFormLoading(true);
    try {
      await auth.signInWithPopup(googleProvider);
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
      setFormLoading(false);
    }
  };

  const handleLogout = () => {
      setError('');
      auth.signOut();
  };

  const addAnimeToLibrary = async (anime: Anime, initialWatched: number) => {
    if (!user) return;
    
    // Optimistic UI for Adding
    const tempId = `temp-${Date.now()}`;
    const tempEntry: WatchListEntry = {
      id: tempId,
      animeId: anime.mal_id,
      title: anime.title,
      imageUrl: anime.images.jpg.large_image_url,
      totalEpisodes: anime.episodes,
      watchedEpisodes: initialWatched,
      genres: anime.genres.map(g => g.name),
      score: anime.score || null,
      synopsis: anime.synopsis || "",
      updatedAt: new Date().toISOString(),
      pending: true
    };
    
    setWatchlist(prev => [tempEntry, ...prev]);

    try {
        const batch = db.batch();
        const watchlistRef = db.collection('users').doc(user.uid).collection('watchlist').doc();
        
        batch.set(watchlistRef, {
          animeId: anime.mal_id,
          title: anime.title,
          imageUrl: anime.images.jpg.large_image_url,
          totalEpisodes: anime.episodes,
          watchedEpisodes: initialWatched,
          genres: anime.genres.map(g => g.name),
          score: anime.score || null,
          synopsis: anime.synopsis || "",
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (initialWatched > 0) {
            const historyRef = db.collection('users').doc(user.uid).collection('history').doc();
            batch.set(historyRef, {
                animeId: anime.mal_id,
                animeTitle: anime.title,
                episodesDelta: initialWatched,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        await batch.commit();
    } catch (err: any) {
        setError(`WRITE_ERROR: ${err.message}`);
        // Revert optimistic add
        setWatchlist(prev => prev.filter(e => e.id !== tempId));
    }
  };

  const performSyncUpdate = async (entry: WatchListEntry, finalAmount: number, delta: number) => {
    if (!user) return;
    setPendingOpsCount(prev => Math.max(0, prev - 1));
    
    try {
        const batch = db.batch();
        const entryRef = db.collection('users').doc(user.uid).collection('watchlist').doc(entry.id);
        const historyRef = db.collection('users').doc(user.uid).collection('history').doc();

        batch.update(entryRef, {
          watchedEpisodes: finalAmount,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        batch.set(historyRef, {
          animeId: entry.animeId,
          animeTitle: entry.title,
          episodesDelta: delta,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();
    } catch (err: any) {
        setError(`DEBOUNCED_SYNC_ERROR: ${err.message}`);
    }
  };

  const updateEpisodesOptimistic = (entry: WatchListEntry, newAmount: number) => {
    if (!user) return;
    
    // 1. Update Application State Immediately (Optimistic)
    setWatchlist(prev => prev.map(e => e.id === entry.id ? { ...e, watchedEpisodes: newAmount, pending: true } : e));

    // 2. Debounce Cloud Sync
    if (syncQueue.current[entry.id]) {
      clearTimeout(syncQueue.current[entry.id].timer);
      const prevDelta = syncQueue.current[entry.id].delta;
      const initialWatched = syncQueue.current[entry.id].initialWatched;
      
      syncQueue.current[entry.id] = {
        initialWatched,
        delta: newAmount - initialWatched,
        timer: setTimeout(() => {
          const { delta } = syncQueue.current[entry.id];
          performSyncUpdate(entry, newAmount, delta);
          delete syncQueue.current[entry.id];
        }, 2000)
      };
    } else {
      setPendingOpsCount(prev => prev + 1);
      syncQueue.current[entry.id] = {
        initialWatched: entry.watchedEpisodes,
        delta: newAmount - entry.watchedEpisodes,
        timer: setTimeout(() => {
          const { delta } = syncQueue.current[entry.id];
          performSyncUpdate(entry, newAmount, delta);
          delete syncQueue.current[entry.id];
        }, 2000)
      };
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-accent">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-accent" />
            <div className="font-mono text-sm animate-pulse uppercase tracking-[0.2em] text-accent">Matrix_Link_Establishing...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (!showAuth) return <><HomePage onStart={() => setShowAuth(true)} isDark={true} toggleTheme={() => {}} /><AmbientSound /></>;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-black text-white">
        <CyberBackground />
        <AmbientSound />
        <button onClick={() => setShowAuth(false)} className="absolute top-6 left-6 z-50 text-gray-500 hover:text-accent flex items-center gap-2 font-mono text-xs transition-colors">
          <ArrowLeft className="w-4 h-4" /> <span>ABORT_SEQUENCE</span>
        </button>
        <CyberCard className="w-full max-w-md animate-slide-up">
          <div className="p-8">
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6 relative">
                 <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
                 <Logo className="w-24 h-24 relative z-10 drop-shadow-[0_0_10px_var(--accent-dim)] animate-pulse" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter mb-1"><GlitchText>ACCESS_CONTROL</GlitchText></h1>
              <p className="text-accent font-mono text-[10px] tracking-[0.2em] uppercase">Verify Identity to Proceed</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-6">
              <CyberInput label="User ID / Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="runner@net.city" />
              <CyberInput label="Access Key / Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              {error && <div className="p-3 border border-cyber-pink bg-cyber-pink/10 text-cyber-pink text-xs font-mono flex items-center gap-2"><Wifi className="w-4 h-4"/> ERROR: {error}</div>}
              <CyberButton type="submit" primary className="w-full" disabled={formLoading}>
                {formLoading ? <div className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /><span>PROCESSING...</span></div> : (isSignUp ? 'Initialize_Account' : 'Jack_In')}
              </CyberButton>
            </form>
            <div className="mt-8 relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div><div className="relative flex justify-center text-xs"><span className="bg-black px-2 text-gray-600 font-mono">ALTERNATE_UPLINK</span></div></div>
            <button type="button" onClick={handleGoogleLogin} disabled={formLoading} className="mt-6 w-full py-3 bg-white hover:bg-gray-100 text-black font-sans font-bold text-sm transition-all flex items-center justify-center gap-3 uppercase tracking-wider group shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Sign In with Google</span>
            </button>
            <div className="mt-8 text-center">
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-accent hover:text-white font-mono hover:underline decoration-accent underline-offset-4">
                {isSignUp ? "HAS_ACCOUNT? EXECUTE LOGIN" : "NO_DATA? CREATE NEW RECORD"}
              </button>
            </div>
          </div>
        </CyberCard>
      </div>
    );
  }

  const stats = calculateStats(history, watchlist);

  return (
    <div className="min-h-screen relative pb-20 font-sans selection:bg-cyber-pink selection:text-white bg-[var(--bg-color)] text-[var(--text-color)] transition-colors duration-500">
      <CyberBackground />
      <AmbientSound />

      <header className="sticky top-0 z-40 bg-[var(--bg-color)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <Logo className="w-10 h-10 hover:scale-110 transition-transform duration-300" />
            <span className="font-mono font-bold text-xl tracking-tighter text-[var(--text-color)] group-hover:text-accent transition-colors">ANI<span className="text-accent">TRACK</span></span>
            
            <button onClick={syncData} className="ml-4 flex items-center gap-2 border-l border-gray-800 pl-4 h-8 group/sync">
               {hasPendingWrites || isSyncing || pendingOpsCount > 0 ? (
                 <div className="flex items-center gap-2 text-amber-500 animate-pulse">
                    <UploadCloud className="w-3.5 h-3.5 animate-bounce" />
                    <span className="text-[10px] font-mono font-bold hidden md:inline">
                      {pendingOpsCount > 0 ? `${pendingOpsCount} PENDING_OPS` : 'UPLINKING...'}
                    </span>
                 </div>
               ) : (
                 <div className="flex items-center gap-2 text-accent">
                    <Cloud className="w-4 h-4 group-hover/sync:scale-110 transition-transform" />
                    <span className="text-[10px] font-mono font-bold hidden md:inline">SYNCHRONIZED</span>
                 </div>
               )}
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end cursor-default font-mono border-r border-gray-800 pr-6 mr-2">
                <span className="text-xs font-bold text-accent leading-none mb-1 flex items-center gap-2">
                   <UserCheck className="w-3 h-3 text-accent" /> {user.displayName || 'ANON_RUNNER'}
                </span>
                <span className="text-[9px] text-gray-500 uppercase tracking-widest">{lastSyncTime ? `SYNC_OK: ${lastSyncTime.toLocaleTimeString()}` : 'INITIALIZING...'}</span>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setShowProfile(true)} className="w-10 h-10 border border-gray-700 hover:border-accent transition-all flex items-center justify-center overflow-hidden bg-black relative">
                     {user.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover opacity-80" /> : <Ghost className="w-5 h-5 text-gray-500" />}
                     <div className="absolute top-0 right-0 w-2 h-2 bg-accent border border-black rounded-full" />
                </button>
                <button onClick={handleLogout} className="p-2 text-gray-600 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        {(error || isOffline) && (
          <div className={`mb-8 p-4 border flex items-center justify-between gap-4 animate-fade-in ${isOffline ? 'bg-amber-900/20 border-amber-500 text-amber-500' : 'bg-cyber-pink/10 border-cyber-pink text-cyber-pink'}`}>
            <div className="flex items-center gap-3">
               {isOffline ? <CloudOff className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
               <div><h3 className="font-bold font-mono tracking-wider">{isOffline ? 'OFFLINE_MODE' : 'SYNC_PROTOCOL_ERROR'}</h3><p className="text-xs font-mono opacity-80">{isOffline ? 'LOCAL_CACHE_ONLY. RECONNECT TO UPLOAD.' : error}</p></div>
            </div>
            <button onClick={() => setError('')} className="p-2 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
          </div>
        )}

        <section className="mb-16 animate-fade-in">
          <div className="flex items-end justify-between mb-8 border-b border-[var(--border-color)] pb-4">
             <div><h2 className="text-2xl font-black text-[var(--text-color)] uppercase tracking-tight mb-1">Data Overview</h2><div className="text-[10px] font-mono text-gray-500">NEURAL_DASHBOARD</div></div>
             <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-[var(--border-color)] hover:border-accent text-gray-400 text-xs font-mono transition-all uppercase tracking-wider">
               <History className="w-3 h-3" /> View Logs
             </button>
          </div>
          <StatsBoard stats={stats} />
        </section>

        <section className="mb-20 flex flex-col items-center">
          <div className="w-full max-w-2xl text-center mb-8">
             <h2 className="text-xl font-bold text-[var(--text-color)] uppercase tracking-widest mb-2"><GlitchText>Database Entry</GlitchText></h2>
             <div className="h-0.5 w-24 bg-accent mx-auto" />
          </div>
          <AnimeSearch onAddAnime={addAnimeToLibrary} watchlist={watchlist} />
        </section>

        <section>
          <div className="flex flex-col sm:flex-row items-end justify-between mb-8 gap-4 border-b border-[var(--border-color)] pb-4">
            <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-[var(--text-color)] flex items-center gap-3 uppercase">MEMORY BANK <span className="text-lg font-mono font-normal text-accent border border-accent px-2 py-0.5">{watchlist.length}</span></h2>
                <button onClick={syncData} disabled={isSyncing} className={`p-2 border border-gray-800 text-gray-600 hover:text-accent hover:border-accent transition-all rounded-full ${isSyncing ? 'animate-spin' : ''}`}><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-gray-500 uppercase">Sort:</span>
              <div className="flex gap-1">
                <button onClick={() => setSortType('updated')} className={`px-3 py-1 text-[10px] font-mono border ${sortType === 'updated' ? 'bg-accent/20 border-accent text-accent' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}>Recent</button>
                <button onClick={() => setSortType('title')} className={`px-3 py-1 text-[10px] font-mono border ${sortType === 'title' ? 'bg-accent/20 border-accent text-accent' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}>Alpha</button>
              </div>
            </div>
          </div>

          {watchlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-gray-800 bg-white/5">
              <Ghost className="w-16 h-16 text-gray-800 mb-4" />
              <p className="font-mono text-gray-500 text-lg uppercase">Memory Void</p>
              <p className="font-mono text-gray-700 text-[10px] mt-2 tracking-widest uppercase">Search to populate</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {sortedWatchlist.map((entry) => (
                <AnimeCard 
                  key={entry.id} 
                  entry={entry} 
                  onUpdateEpisodes={updateEpisodesOptimistic} 
                  onRemove={(id) => {
                    if (window.confirm("WARNING: Purge record?")) {
                      db.collection('users').doc(user.uid).collection('watchlist').doc(id).delete();
                    }
                  }} 
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {showProfile && user && <UserProfile user={user} stats={stats} animeCount={watchlist.length} themeSettings={themeSettings} onClose={() => setShowProfile(false)} />}
      {showHistory && <HistoryModal history={history} watchlist={watchlist} onClose={() => setShowHistory(false)} onUpdate={async (id, data) => {
        await db.collection('users').doc(user.uid).collection('history').doc(id).update(data);
      }} onDelete={async (id) => {
        await db.collection('users').doc(user.uid).collection('history').doc(id).delete();
      }} />}
    </div>
  );
};

export default App;
