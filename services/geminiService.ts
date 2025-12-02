import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// Note: In production, it's safer to proxy these requests, but for this app we use client-side key.
// The API key must be obtained exclusively from process.env.API_KEY
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
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "No recommendations generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to get recommendations. Please try again later.");
  }
};