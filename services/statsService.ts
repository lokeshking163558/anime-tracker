import { WatchHistoryItem, UserStats } from '../types';
import { EPISODE_DURATION_MINUTES } from '../constants';

export const calculateStats = (history: WatchHistoryItem[]): UserStats => {
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
  let lifetimeEpisodes = 0;

  history.forEach(item => {
    const itemDate = new Date(item.timestamp);
    const episodes = item.episodesDelta;

    // We only care about positive progress for "Watch time", 
    // though arguably rewinding/unwatching shouldn't count. 
    // For simplicity, we count absolute value if positive, ignore negatives (correction).
    if (episodes <= 0) return;

    lifetimeEpisodes += episodes;

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