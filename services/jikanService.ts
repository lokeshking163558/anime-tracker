
import { Anime } from '../types';

const BASE_URL = 'https://api.jikan.moe/v4';

interface JikanResponse {
  data: Anime[];
  pagination: {
    has_next_page: boolean;
  };
}

// Simple in-memory cache to reduce API calls and handle temporary downtime
const searchCache: Record<string, Anime[]> = {};

export const searchAnime = async (query: string, retryCount = 0): Promise<Anime[]> => {
  if (!query) return [];
  
  const cacheKey = query.toLowerCase().trim();
  if (searchCache[cacheKey] && retryCount === 0) {
    return searchCache[cacheKey];
  }
  
  try {
    const response = await fetch(`${BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`);
    
    if (response.status === 429) {
      // If we hit rate limit, wait a bit and retry once if it's the first attempt
      if (retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return searchAnime(query, retryCount + 1);
      }
      throw new Error("RateLimit: You are searching too fast. Please wait a moment.");
    }

    if (response.status >= 500) {
      // If server error, retry once after a short delay
      if (retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return searchAnime(query, retryCount + 1);
      }
      throw new Error("Server: Jikan API is currently down or experiencing issues.");
    }
    
    if (!response.ok) {
      throw new Error(`Error: Service unavailable (${response.status}). Please try again.`);
    }
    
    const data: JikanResponse = await response.json();
    const results = data.data || [];
    
    // Cache successful results
    if (results.length > 0) {
      searchCache[cacheKey] = results;
    }
    
    return results;
  } catch (error: any) {
    console.error("Failed to fetch anime:", error?.message || String(error));
    
    // Handle Network Errors (e.g. Offline)
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      // Retry network errors once as well
      if (retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return searchAnime(query, retryCount + 1);
      }
      throw new Error("Network: Unable to connect. Check your internet connection.");
    }
    
    // Re-throw the error so the UI can handle it
    throw error;
  }
};
