
import { GoogleGenAI } from "@google/genai";

// Declare process to avoid TypeScript errors.
// Vite will replace 'process.env.API_KEY' with the literal string at build time.
declare const process: {
  env: {
    API_KEY: string;
  }
};

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAnimeRecommendations = async (userWatchlist: string[]): Promise<string> => {
  try {
    let prompt = "";
    if (userWatchlist.length === 0) {
      prompt = "Recommend 5 distinct, highly-rated anime series for a beginner. Provide the output as a simple list with a 1-sentence description for each. Do not use markdown formatting like bolding.";
    } else {
      const watched = userWatchlist.slice(0, 20).join(", ");
      prompt = `I have watched the following anime: ${watched}. Based on this taste, recommend 5 NEW anime series I haven't watched yet. Provide the output as a simple list with a 1-sentence description for each. Do not use markdown formatting like bolding.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "No recommendations generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to get recommendations. Please try again later.");
  }
};
