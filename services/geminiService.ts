import { GoogleGenAI, Type } from "@google/genai";
import { PollCreationData } from "../types";

const createClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePollContent = async (topic: string): Promise<PollCreationData> => {
  const ai = createClient();
  
  const prompt = `Generate an engaging poll question, a brief description, 4 distinct voting options, the best-matching category (from: Technology, Lifestyle, Food, Entertainment, Sports, Politics, Education, Travel, Health & Wellness, Finance, Science, Art & Culture, Other), and 3-5 relevant short topic tags (e.g. React, AI, WebDev) based on the topic: "${topic}". 
  The question should be thought-provoking. The options should cover different perspectives.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: "The main question for the poll" },
            description: { type: Type.STRING, description: "A short context or description (1-2 sentences)" },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of 4 distinct options for voting"
            },
            category: { type: Type.STRING, description: "The most fitting category (e.g. Technology, Politics, Lifestyle, Food)" },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 to 5 short keyword tags related to the poll"
            }
          },
          required: ["question", "description", "options"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(text) as PollCreationData;
    return data;
  } catch (error) {
    console.error("Error generating poll content:", error);
    throw error;
  }
};