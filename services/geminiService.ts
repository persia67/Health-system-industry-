import { GoogleGenAI, ChatSession, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

// NOTE: in a real production app, you should not expose the API key on the client side.
// This should be proxied through a backend. 
// For this demo, we assume the env var is available or we use a placeholder.
const API_KEY = process.env.API_KEY || ''; 

let ai: GoogleGenAI | null = null;

const getAIInstance = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
};

export const createChatSession = (): ChatSession => {
  const instance = getAIInstance();
  return instance.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are an expert Occupational Health Assistant ( دستیار هوشمند سلامت شغلی). 
      You help doctors and health officers analyze worker health data.
      Answer in Persian (Farsi).
      Be professional, concise, and medical-focused.
      If asked about specific medical advice, provide general guidelines based on occupational health standards (HSE, OSHA) but advise consulting a specialist.`,
    }
  });
};

export const sendMessageToGemini = async (chat: ChatSession, message: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await chat.sendMessage({
      message: message
    });
    
    return response.text || "متاسفانه پاسخی دریافت نشد.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "خطا در ارتباط با هوش مصنوعی. لطفا اتصال خود را بررسی کنید.";
  }
};