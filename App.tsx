import React, { useState, useEffect, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import { auth, db, googleProvider } from './firebase';
import { Anime, WatchListEntry, WatchHistoryItem, Theme } from './types';
import { calculateStats } from './services/statsService';
import { AnimeSearch } from './components/AnimeSearch';
import { AnimeCard } from './components/AnimeCard';
import { StatsBoard } from './components/StatsBoard';
import { ThemeToggle } from './components/ThemeToggle';
import { Loader2, LogIn, LogOut, Tv, ArrowUpDown } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<WatchListEntry[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [theme, setTheme] = useState<Theme>(Theme.SAKURA);
  const [sortType, setSortType] = useState<'updated' | 'title'>('updated');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  // 1. Theme Initialization
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme(Theme.MIDNIGHT);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === Theme.MIDNIGHT) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // 2. Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. Data Listeners (only when logged in)
  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      setHistory([]);
      return;
    }

    // Listen to Watchlist
    const watchlistRef = db.collection('users').doc(user.uid).collection('watchlist');
    
    // Simple query without complex indexing
    const unsubWatchlist = watchlistRef.onSnapshot((snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WatchListEntry[];
      setWatchlist(list);
    }, (error) => {
        console.error("Watchlist Error:", error);
        // Only show alert for permissions, not empty list
        if (error.code === 'permission-denied') {
            setError("Database permission denied. Please check Firestore Rules.");
        }
    });

    // Listen to History (for stats)
    const historyRef = db.collection('users').doc(user.uid).collection('history');
    const unsubHistory = historyRef.onSnapshot((snapshot) => {
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

  // Derived State: Sorted Watchlist
  const sortedWatchlist = useMemo(() => {
    const data = [...watchlist];
    if (sortType === 'updated') {
      return data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      return data.sort((a, b) => a.title.localeCompare(b.title));
    }
  }, [watchlist, sortType]);

  // Handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await auth.createUserWithEmailAndPassword(email, password);
      } else {
        await auth.signInWithEmailAndPassword(email, password);
      }
    } catch (err: any) {
      // Clean up error message
      const message = err.message || "An error occurred";
      // Remove generic Firebase prefix if present
      const cleanMessage = message.replace('Firebase: ', '').replace(' (auth/invalid-email).', '.');
      
      if (message.includes('auth/configuration-not-found')) {
        setError("Login failed. Please ensure 'Email/Password' sign-in is enabled in your Firebase Console.");
      } else {
        setError(cleanMessage);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await auth.signInWithPopup(googleProvider);
    } catch (err: any) {
      const message = err.message || "Google sign-in failed";
      // Check for popup closed by user
      if (message.includes('auth/popup-closed-by-user')) {
        return; 
      }
      if (message.includes('auth/configuration-not-found') || message.includes('auth/operation-not-allowed')) {
        setError("Google Sign-In is not enabled. Please enable it in the Firebase Console.");
      } else if (message.includes('auth/unauthorized-domain')) {
        setError(`This domain (${window.location.hostname}) is not authorized. Add it in Firebase Console > Authentication > Settings > Authorized Domains.`);
      } else {
        setError(message.replace('Firebase: ', ''));
      }
    }
  };

  const handleLogout = () => auth.signOut();

  const toggleTheme = () => {
    setTheme(prev => prev === Theme.SAKURA ? Theme.MIDNIGHT : Theme.SAKURA);
  };

  const addAnimeToLibrary = async (anime: Anime, initialWatched: number) => {
    if (!user) return;
    
    // Check if already exists
    const existing = watchlist.find(w => w.animeId === anime.mal_id);
    if (existing) {
      alert("This anime is already in your library!");
      return;
    }

    // Validation
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

        // Record initial history if episodes > 0 so stats are accurate
        if (safeWatched > 0) {
            const historyRef = db.collection('users').doc(user.uid).collection('history');
            await historyRef.add({
                animeId: anime.mal_id,
                episodesDelta: safeWatched,
                timestamp: now
            });
        }
    } catch (err: any) {
        console.error("Add Error:", err);
        if (err.code === 'permission-denied') {
            alert("Error: Missing permissions. Please set Firestore Rules to 'allow read, write: if request.auth != null;'");
        } else if (err.code === 'not-found') {
            alert("Error: Database not found. Please create a Firestore Database in the Firebase Console (Test Mode).");
        } else {
            alert(`Error adding anime: ${err.message}`);
        }
    }
  };

  const updateEpisodes = async (entry: WatchListEntry, newAmount: number) => {
    if (!user) return;
    
    const delta = newAmount - entry.watchedEpisodes;
    if (delta === 0) return;

    try {
        const now = new Date().toISOString();

        // 1. Update Watchlist Doc
        const entryRef = db.collection('users').doc(user.uid).collection('watchlist').doc(entry.id);
        await entryRef.update({
          watchedEpisodes: newAmount,
          updatedAt: now
        });

        // 2. Add History Entry
        const historyRef = db.collection('users').doc(user.uid).collection('history');
        await historyRef.add({
          animeId: entry.animeId,
          episodesDelta: delta,
          timestamp: now
        });
    } catch (err: any) {
        alert(`Failed to update episodes: ${err.message}`);
    }
  };

  const removeAnime = async (id: string) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to remove this anime from your library?")) {
      try {
          const entryRef = db.collection('users').doc(user.uid).collection('watchlist').doc(id);
          await entryRef.delete();
      } catch (err: any) {
          alert(`Failed to remove anime: ${err.message}`);
      }
    }
  };

  // Views
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sakura-50 dark:bg-midnight-950">
        <Loader2 className="w-10 h-10 animate-spin text-sakura-500" />
      </div>
    );
  }

  // --- LANDING / AUTH PAGE ---
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-300 dark:bg-purple-900 rounded-full blur-[100px] opacity-30 animate-pulse" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300 dark:bg-indigo-900 rounded-full blur-[100px] opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="absolute top-4 right-4">
          <ThemeToggle isDark={theme === Theme.MIDNIGHT} toggleTheme={toggleTheme} />
        </div>

        <div className="glass-panel p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 dark:border-slate-800 animate-slide-up">
          <div className="text-center mb-8">
            <div className="mb-6 relative group inline-block">
                <div className="absolute inset-0 bg-sakura-400 dark:bg-purple-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                <img src="/logo.png" alt="AniTrack Logo" className="w-24 h-24 relative z-10 rounded-full shadow-2xl border-4 border-white/20 dark:border-slate-700/50 object-cover" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">AniTrack</h1>
            <p className="text-slate-500 dark:text-slate-400">Track your journey through the anime world.</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sakura-400 focus:outline-none dark:text-white"
                placeholder="shinji@nerv.org"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sakura-400 focus:outline-none dark:text-white"
                placeholder="••••••••"
              />
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sakura-500 to-sakura-600 dark:from-indigo-600 dark:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              {isSignUp ? 'Start Your Journey' : 'Welcome Back'}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-4">
            <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
            <span className="text-xs text-slate-400">OR</span>
            <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="mt-4 w-full py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                className="text-blue-500"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                className="text-green-500"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                className="text-yellow-500"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                className="text-red-500"
              />
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-sakura-600 dark:hover:text-purple-300 underline underline-offset-4"
            >
              {isSignUp ? "Already have an account? Sign In" : "New here? Create an Account"}
            </button>
          </div>
          
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  const stats = calculateStats(history);

  return (
    <div className="min-h-screen relative pb-10">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-sakura-200 dark:bg-purple-900/40 rounded-full blur-[120px] opacity-40 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-blue-200 dark:bg-indigo-900/40 rounded-full blur-[120px] opacity-40 mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-midnight-950/70 backdrop-blur-lg border-b border-sakura-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="AniTrack Logo" className="w-8 h-8 rounded-full shadow-sm object-cover" />
            <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-slate-100">AniTrack</span>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="hidden md:block text-sm text-slate-500 dark:text-slate-400">
                {user.email}
             </div>
            <ThemeToggle isDark={theme === Theme.MIDNIGHT} toggleTheme={toggleTheme} />
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Stats Section */}
        <section className="mb-12 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">Overview</h2>
          <StatsBoard stats={stats} />
        </section>

        {/* Search Section */}
        <section className="mb-12 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">Add to Library</h2>
          <AnimeSearch onAddAnime={addAnimeToLibrary} watchlist={watchlist} />
        </section>

        {/* Library Section */}
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              My Library <span className="text-base font-normal text-slate-400">({watchlist.length})</span>
            </h2>
            
            {/* Sort Controls */}
            {watchlist.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">Sort by:</span>
                <div className="flex bg-white/50 dark:bg-slate-800/50 rounded-lg p-1 border border-sakura-100 dark:border-slate-700 backdrop-blur-sm">
                  <button
                    onClick={() => setSortType('updated')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${sortType === 'updated' ? 'bg-sakura-500 dark:bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700'}`}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setSortType('title')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${sortType === 'title' ? 'bg-sakura-500 dark:bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700'}`}
                  >
                    A-Z
                  </button>
                </div>
              </div>
            )}
          </div>

          {watchlist.length === 0 ? (
            <div className="text-center py-20 bg-white/30 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 text-lg">Your library is empty.</p>
              <p className="text-slate-400 text-sm">Search for an anime above to get started!</p>
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
    </div>
  );
};

export default App;