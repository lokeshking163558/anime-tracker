
import { Anime } from '../types';

const BASE_URL = 'https://api.jikan.moe/v4';

interface JikanResponse {
  data: Anime[];
  pagination: {
    has_next_page: boolean;
  };
}

export const searchAnime = async (query: string): Promise<Anime[]> => {
  if (!query) return [];
  
  try {
    const response = await fetch(`${BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`);
    
    if (response.status === 429) {
      throw new Error("RateLimit: You are searching too fast. Please wait a moment.");
    }

    if (response.status >= 500) {
      throw new Error("Server: Jikan API is currently down or experiencing issues.");
    }
    
    if (!response.ok) {
      throw new Error(`Error: Service unavailable (${response.status}). Please try again.`);
    }
    
    const data: JikanResponse = await response.json();
    return data.data || [];
  } catch (error: any) {
    console.error("Failed to fetch anime:", error);
    
    // Handle Network Errors (e.g. Offline)
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error("Network: Unable to connect. Check your internet connection.");
    }
    
    // Re-throw the error so the UI can handle it
    throw error;
  }
};
