import { WatchHistoryItem, UserStats, WatchListEntry } from '../types';
import { EPISODE_DURATION_MINUTES } from '../constants';

export const calculateStats = (history: WatchHistoryItem[], watchlist: WatchListEntry[] = []): UserStats => {
  const now = new Date();
  
  // Start of Day (00:00:00)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Start of Month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Start of Year
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let todayEpisodes = 0;
  let monthEpisodes = 0;
  let yearEpisodes = 0;

  // Calculate activity-based stats from history
  history.forEach(item => {
    const itemDate = new Date(item.timestamp);
    const episodes = item.episodesDelta;

    // We only care about positive progress for "Watch time" logs
    if (episodes <= 0) return;

    if (itemDate >= startOfYear) {
      yearEpisodes += episodes;
    }
    if (itemDate >= startOfMonth) {
      monthEpisodes += episodes;
    }
    if (itemDate >= startOfDay) {
      todayEpisodes += episodes;
    }
  });

  // Calculate lifetime stats based on the current watchlist state
  // This ensures the "Total" always reflects the sum of the library, even if history is incomplete.
  const lifetimeEpisodes = watchlist.reduce((acc, entry) => acc + (entry.watchedEpisodes || 0), 0);

  return {
    todayMinutes: todayEpisodes * EPISODE_DURATION_MINUTES,
    monthMinutes: monthEpisodes * EPISODE_DURATION_MINUTES,
    yearMinutes: yearEpisodes * EPISODE_DURATION_MINUTES,
    lifetimeMinutes: lifetimeEpisodes * EPISODE_DURATION_MINUTES,
  };
};

export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
};