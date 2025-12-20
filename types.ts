
export interface Anime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      large_image_url: string;
      image_url: string;
    };
  };
  episodes: number | null;
  genres: { name: string }[];
  score?: number;
  synopsis?: string;
}

export interface ThemeSettings {
  mode: 'dark' | 'light';
  accentColor: string;
  accentName: string;
}

export interface WatchListEntry {
  id: string; // Firestore ID
  animeId: number;
  title: string;
  imageUrl: string;
  totalEpisodes: number | null;
  watchedEpisodes: number;
  genres: string[];
  updatedAt: string; // ISO String
  pending?: boolean; // True if data has not yet synced to the cloud
  score?: number;
  synopsis?: string;
}

export interface WatchHistoryItem {
  id?: string;
  animeId: number;
  animeTitle?: string;
  episodesDelta: number;
  timestamp: string; // ISO String
}

export interface UserStats {
  todayMinutes: number;
  monthMinutes: number;
  yearMinutes: number;
  lifetimeMinutes: number;
}
