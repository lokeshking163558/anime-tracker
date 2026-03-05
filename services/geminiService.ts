
import { GoogleGenAI, Type } from "@google/genai";

// Declare process to avoid TypeScript errors.
// Vite will replace 'process.env.API_KEY' with the literal string at build time.
declare const process: {
  env: {
    API_KEY: string;
  }
};

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface Recommendation {
  title: string;
  description: string;
  reason: string;
}

export const getAnimeRecommendations = async (userWatchlist: string[]): Promise<Recommendation[]> => {
  try {
    let prompt = "";
    if (userWatchlist.length === 0) {
      prompt = "Recommend 5 distinct, highly-rated anime series for a beginner.";
    } else {
      const watched = userWatchlist.slice(0, 20).join(", ");
      prompt = `I have watched the following anime: ${watched}. Based on this taste, recommend 5 NEW anime series I haven't watched yet.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "The title of the anime" },
              description: { type: Type.STRING, description: "A 1-sentence description of the anime" },
              reason: { type: Type.STRING, description: "Why this is recommended based on user taste" }
            },
            required: ["title", "description", "reason"]
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini API Error:", error?.message || String(error));
    throw new Error("Failed to get recommendations. Please try again later.");
  }
};
