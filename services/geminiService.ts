// Add type declaration for process.env to satisfy TypeScript in a browser environment.
// This allows the build process (e.g., GitHub Actions) to replace the value.
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

import { GoogleGenAI, Type } from "@google/genai";
import type { ChatMessage, CrowdData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function getCrowdRecommendations(crowdData: CrowdData): Promise<string[]> {
  try {
    const { totalCount, density, riskLevel, congestionPoints } = crowdData;
    const prompt = `
      Analyze the following crowd data and provide 3 brief, actionable recommendations for crowd management.
      Data:
      - Total people: ${totalCount}
      - Density: ${density.toFixed(2)} people per square meter
      - Risk Level: ${riskLevel}
      - Congestion Hotspots (normalized coordinates): ${congestionPoints.length > 0 ? JSON.stringify(congestionPoints.map(p => ({x: p.x.toFixed(2), y: p.y.toFixed(2)}))) : 'None'}
      
      Focus on immediate safety and flow improvement. Be direct and clear.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    recommendations: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING, description: "A single, actionable recommendation." }
                    }
                },
                required: ["recommendations"]
            }
        }
    });

    const jsonText = (response.text ?? '').trim();
    if (!jsonText) {
      return ["No new recommendations from AI."];
    };
    const result = JSON.parse(jsonText);
    return result.recommendations || [];

  } catch (error) {
    console.error("Error getting recommendations from Gemini:", error);
    return ["AI service unavailable. Please monitor the situation manually."];
  }
}

export async function getChatResponse(
  history: ChatMessage[],
  crowdData: CrowdData | null,
  historicalData: CrowdData[],
  userQuery: string
): Promise<string> {
  try {
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are an AI crowd safety assistant. Your name is Sense. You are direct, helpful, and prioritize safety. 
    Use the real-time crowd data and historical trend analysis provided to answer questions. If there is no data, say that the live feed is inactive. Keep responses concise and data-driven.`;

    let context = "No live data available.";
    if (crowdData) {
        context = `Current Crowd Status:
        - Headcount: ${crowdData.totalCount}
        - Density: ${crowdData.density.toFixed(2)} p/m²
        - Risk Level: ${crowdData.riskLevel}
        - AI Recommendations: ${crowdData.recommendations.join(', ')}`;
    }
    
    // Historical Trend Analysis
    if (historicalData.length > 1) {
      const lastFiveMinutes = historicalData.filter(d => (Date.now() - d.timestamp) < 5 * 60 * 1000);
      if (lastFiveMinutes.length > 1) {
        const peakCount = Math.max(...lastFiveMinutes.map(d => d.totalCount));
        const startCount = lastFiveMinutes[lastFiveMinutes.length - 1]?.totalCount;
        const endCount = lastFiveMinutes[0]?.totalCount;
        let trend = "stable";
        if (endCount > startCount * 1.1) trend = "increasing";
        if (endCount < startCount * 0.9) trend = "decreasing";

        context += `\n\nHistorical Trend (Last 5 mins):
        - Peak Headcount: ${peakCount}
        - Trend: The crowd size is currently ${trend}.`;
      }
    }

    const chat = ai.chats.create({
      model,
      config: { systemInstruction },
      history: history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
    });

    const fullPrompt = `CONTEXT: ${context}\n\nUSER QUERY: ${userQuery}`;

    const response = await chat.sendMessage({ message: fullPrompt });

    return response.text ?? "Sorry, I could not generate a response.";

  } catch (error) {
    console.error("Error getting chat response from Gemini:", error);
    return "I'm sorry, I encountered an error. Please try again.";
  }
}
