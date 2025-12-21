
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Use Chat instead of ChatSession to comply with @google/genai types
export const createChatSession = (): Chat => {
  // Always create a new instance right before use to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are an expert Occupational Health Assistant ( دستیار هوشمند سلامت شغلی). 
      You help doctors and health officers analyze worker health data.
      Answer in Persian (Farsi).
      Be professional, concise, and medical-focused.
      If asked about specific medical advice, provide general guidelines based on occupational health standards (HSE, OSHA) but advise consulting a specialist.`,
    }
  });
};

// Use Chat instead of ChatSession to comply with @google/genai types
export const sendMessageToGemini = async (chat: Chat, message: string): Promise<string> => {
  try {
    // Ensuring we have the key before sending
    if (!process.env.API_KEY) {
      throw new Error("API_KEY_MISSING");
    }

    const response: GenerateContentResponse = await chat.sendMessage({
      message: message
    });
    
    return response.text || "متاسفانه پاسخی دریافت نشد.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message === "API_KEY_MISSING") {
      return "کلید API تنظیم نشده است. لطفاً از طریق منوی تنظیمات کلید را انتخاب کنید.";
    }
    return "خطا در ارتباط با هوش مصنوعی. لطفا اتصال خود را بررسی کنید.";
  }
};
