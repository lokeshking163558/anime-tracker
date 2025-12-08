import React, { useState, useEffect, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import { auth, db, googleProvider } from './firebase';
import { Anime, WatchListEntry, WatchHistoryItem } from './types';
import { calculateStats } from './services/statsService';
import { AnimeSearch } from './components/AnimeSearch';
import { AnimeCard } from './components/AnimeCard';
import { StatsBoard } from './components/StatsBoard';
import { UserProfile } from './components/UserProfile';
import { HistoryModal } from './components/HistoryModal';
import { HomePage } from './components/HomePage';
import { CyberBackground, CyberButton, CyberInput, CyberCard, GlitchText } from './components/CyberUI';
import { Logo } from './components/Logo';
import { Loader2, LogOut, History, ArrowLeft, Ghost, Wifi } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<WatchListEntry[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [sortType, setSortType] = useState<'updated' | 'title'>('updated');
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Auth Form State
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

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

  // Data Listeners
  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      setHistory([]);
      return;
    }

    const watchlistRef = db.collection('users').doc(user.uid).collection('watchlist');
    // includeMetadataChanges: true ensures we see local writes immediately before they sync
    const unsubWatchlist = watchlistRef.onSnapshot({ includeMetadataChanges: true }, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WatchListEntry[];
      setWatchlist(list);
    }, (error) => {
        console.error("Watchlist Error:", error);
        if (error.code === 'permission-denied') {
            setError("Database permission denied. Check Rules.");
        }
    });

    const historyRef = db.collection('users').doc(user.uid).collection('history');
    const unsubHistory = historyRef.onSnapshot({ includeMetadataChanges: true }, (snapshot) => {
      const hist = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WatchHistoryItem[];
      setHistory(hist);
    });

    return () => {
      unsubWatchlist();
      unsubHistory();
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
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled by user.');
        return;
      }
      if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google Sign-In. Please check Firebase Console.');
        return;
      }
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = () => auth.signOut();

  const addAnimeToLibrary = async (anime: Anime, initialWatched: number) => {
    if (!user) return;
    const existing = watchlist.find(w => w.animeId === anime.mal_id);
    if (existing) {
      alert("ENTRY ALREADY EXISTS IN DATABASE.");
      return;
    }

    const safeWatched = Math.max(0, isNaN(initialWatched) ? 0 : initialWatched);

    try {
        const now = new Date().toISOString();
        const newEntry: Omit<WatchListEntry, 'id'> = {
          animeId: anime.mal_id,
          title: anime.title,
          imageUrl: anime.images.jpg.large_image_url,
          totalEpisodes: anime.episodes,
          watchedEpisodes: safeWatched,
          genres: anime.genres.map(g => g.name),
          updatedAt: now
        };

        const watchlistRef = db.collection('users').doc(user.uid).collection('watchlist');
        await watchlistRef.add(newEntry);

        if (safeWatched > 0) {
            const historyRef = db.collection('users').doc(user.uid).collection('history');
            await historyRef.add({
                animeId: anime.mal_id,
                animeTitle: anime.title,
                episodesDelta: safeWatched,
                timestamp: now
            });
        }
    } catch (err: any) {
        alert(`WRITE ERROR: ${err.message}`);
    }
  };

  const updateEpisodes = async (entry: WatchListEntry, newAmount: number) => {
    if (!user) return;
    const delta = newAmount - entry.watchedEpisodes;
    if (delta === 0) return;

    try {
        const now = new Date().toISOString();
        const entryRef = db.collection('users').doc(user.uid).collection('watchlist').doc(entry.id);
        await entryRef.update({
          watchedEpisodes: newAmount,
          updatedAt: now
        });

        const historyRef = db.collection('users').doc(user.uid).collection('history');
        await historyRef.add({
          animeId: entry.animeId,
          animeTitle: entry.title,
          episodesDelta: delta,
          timestamp: now
        });
    } catch (err: any) {
        alert(`UPDATE ERROR: ${err.message}`);
    }
  };

  const updateHistoryEntry = async (id: string, updates: Partial<WatchHistoryItem>) => {
    if (!user) return;
    try {
      await db.collection('users').doc(user.uid).collection('history').doc(id).update(updates);
    } catch (err: any) {
      alert(`SYNC ERROR: ${err.message}`);
    }
  };

  const deleteHistoryEntry = async (id: string) => {
    if (!user) return;
    try {
      await db.collection('users').doc(user.uid).collection('history').doc(id).delete();
    } catch (err: any) {
      alert(`DELETE ERROR: ${err.message}`);
    }
  };

  const removeAnime = async (id: string) => {
    if (!user) return;
    if (window.confirm("WARNING: Confirm deletion of database entry.")) {
      try {
          const entryRef = db.collection('users').doc(user.uid).collection('watchlist').doc(id);
          await entryRef.delete();
      } catch (err: any) {
          alert(`PURGE ERROR: ${err.message}`);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-[#00ff9f]">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin" />
            <div className="font-mono text-sm animate-pulse">ESTABLISHING CONNECTION...</div>
        </div>
      </div>
    );
  }

  // --- LANDING / AUTH PAGE ---
  if (!user) {
    if (!showAuth) {
        return <HomePage onStart={() => setShowAuth(true)} isDark={true} toggleTheme={() => {}} />;
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-black text-white">
        <CyberBackground />
        
        <button 
          onClick={() => setShowAuth(false)}
          className="absolute top-6 left-6 z-50 text-gray-500 hover:text-[#00ff9f] flex items-center gap-2 font-mono text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ABORT_SEQUENCE</span>
        </button>

        <CyberCard className="w-full max-w-md animate-slide-up">
          <div className="p-8">
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6 relative">
                 <div className="absolute inset-0 bg-[#00ff9f]/20 blur-2xl rounded-full" />
                 <Logo className="w-24 h-24 relative z-10 drop-shadow-[0_0_10px_rgba(0,255,159,0.6)] animate-pulse" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter mb-1">
                 <GlitchText>ACCESS_CONTROL</GlitchText>
              </h1>
              <p className="text-[#00ff9f] font-mono text-[10px] tracking-[0.2em] uppercase">
                 Verify Identity to Proceed
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <CyberInput
                label="User ID / Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="runner@net.city"
              />
              <CyberInput
                label="Access Key / Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              
              {error && (
                <div className="p-3 border border-[#ff0055] bg-[#ff0055]/10 text-[#ff0055] text-xs font-mono flex items-center gap-2">
                   <Wifi className="w-4 h-4"/> ERROR: {error}
                </div>
              )}

              <CyberButton type="submit" primary className="w-full" disabled={formLoading}>
                {formLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>PROCESSING...</span>
                  </div>
                ) : (
                  isSignUp ? 'Initialize_Account' : 'Jack_In'
                )}
              </CyberButton>
            </form>

            <div className="mt-8 relative">
               <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-gray-800"></div>
               </div>
               <div className="relative flex justify-center text-xs">
                 <span className="bg-black px-2 text-gray-600 font-mono">ALTERNATE_UPLINK</span>
               </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={formLoading}
              className={`mt-6 w-full py-3 border border-gray-800 hover:border-white text-gray-400 hover:text-white font-mono text-xs transition-colors flex items-center justify-center gap-3 bg-transparent uppercase tracking-wider group ${formLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-4 h-4 fill-current transition-colors" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>CONNECT_GOOGLE</span>
            </button>

            <div className="mt-8 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-[#00ff9f] hover:text-white font-mono hover:underline decoration-[#00ff9f] underline-offset-4"
              >
                {isSignUp ? "HAS_ACCOUNT? EXECUTE LOGIN" : "NO_DATA? CREATE NEW RECORD"}
              </button>
            </div>
            
          </div>
        </CyberCard>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  // Updated to pass watchlist for calculating lifetime stats
  const stats = calculateStats(history, watchlist);

  return (
    <div className="min-h-screen relative pb-20 font-sans selection:bg-[#ff0055] selection:text-white bg-black">
      <CyberBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <Logo className="w-10 h-10 hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(0,255,159,0.3)]" />
            <span className="font-mono font-bold text-xl tracking-tighter text-white group-hover:text-[#00ff9f] transition-colors">
                ANI<span className="text-[#00ff9f]">TRACK</span>
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end cursor-default font-mono">
                <span className="text-xs font-bold text-[#00ff9f] leading-none mb-1">
                    RUNNER: {user.displayName || 'ANON'}
                </span>
                <span className="text-[10px] text-gray-600 uppercase tracking-widest">
                    ID: {user.uid.substring(0,6)}
                </span>
            </div>
            
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setShowProfile(true)}
                    className="w-10 h-10 border border-gray-700 hover:border-[#ff0055] hover:shadow-[0_0_10px_#ff0055] transition-all flex items-center justify-center overflow-hidden bg-black"
                    title="Identity Module"
                >
                     {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover opacity-80 hover:opacity-100" />
                     ) : (
                        <Ghost className="w-5 h-5 text-gray-500" />
                     )}
                </button>

                <div className="h-6 w-px bg-gray-800 mx-1"></div>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                  title="Sever Connection"
                >
                  <LogOut className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        
        {/* Stats Section */}
        <section className="mb-16 animate-fade-in">
          <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
             <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Data Overview</h2>
                <div className="text-[10px] font-mono text-gray-500">REAL-TIME ANALYTICS</div>
             </div>
             <button
               onClick={() => setShowHistory(true)}
               className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-[#00ff9f] hover:text-[#00ff9f] text-gray-400 text-xs font-mono transition-all uppercase tracking-wider"
             >
               <History className="w-3 h-3" />
               View Logs
             </button>
          </div>
          <StatsBoard stats={stats} />
        </section>

        {/* Search Section */}
        <section className="mb-20 flex flex-col items-center">
          <div className="w-full max-w-2xl text-center mb-8">
             <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-2"><GlitchText>Database Entry</GlitchText></h2>
             <div className="h-0.5 w-24 bg-[#ff0055] mx-auto" />
          </div>
          <AnimeSearch onAddAnime={addAnimeToLibrary} watchlist={watchlist} />
        </section>

        {/* Library Section */}
        <section>
          <div className="flex flex-col sm:flex-row items-end justify-between mb-8 gap-4 border-b border-white/10 pb-4">
            <div>
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                MEMORY BANK <span className="text-lg font-mono font-normal text-[#00ff9f] border border-[#00ff9f] px-2 py-0.5 rounded-none">{watchlist.length}</span>
                </h2>
            </div>
            
            {/* Sort Controls */}
            {watchlist.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-gray-500 uppercase">Sort Protocol:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSortType('updated')}
                    className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition-all border ${sortType === 'updated' ? 'bg-[#00ff9f]/20 border-[#00ff9f] text-[#00ff9f]' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setSortType('title')}
                    className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition-all border ${sortType === 'title' ? 'bg-[#00ff9f]/20 border-[#00ff9f] text-[#00ff9f]' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}
                  >
                    Alpha
                  </button>
                </div>
              </div>
            )}
          </div>

          {watchlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-gray-800 bg-white/5">
              <Ghost className="w-16 h-16 text-gray-800 mb-4" />
              <p className="font-mono text-gray-500 text-lg">MEMORY EMPTY</p>
              <p className="font-mono text-gray-700 text-xs mt-2">INITIATE SEARCH PROTOCOL TO POPULATE</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedWatchlist.map((entry) => (
                <AnimeCard 
                  key={entry.id} 
                  entry={entry} 
                  onUpdateEpisodes={updateEpisodes}
                  onRemove={removeAnime}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* User Profile Modal */}
      {showProfile && user && (
        <UserProfile 
            user={user} 
            stats={stats} 
            animeCount={watchlist.length}
            onClose={() => setShowProfile(false)} 
        />
      )}

      {/* History Modal */}
      {showHistory && (
        <HistoryModal
          history={history}
          watchlist={watchlist}
          onClose={() => setShowHistory(false)}
          onUpdate={updateHistoryEntry}
          onDelete={deleteHistoryEntry}
        />
      )}
    </div>
  );
};

export default App;