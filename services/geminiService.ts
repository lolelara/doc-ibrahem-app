
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME, GEMINI_NUTRITION_SYSTEM_INSTRUCTION } from '../constants';
import { AIAssistantMessage } from "../types";

// IMPORTANT: API_KEY must be set in the environment variables.
// The problem statement implies `process.env.API_KEY` is available.
// For a typical React app (CRA/Vite), this would be `process.env.REACT_APP_API_KEY` or `import.meta.env.VITE_API_KEY`.
// We will use `process.env.API_KEY` directly as per the problem instructions.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API Key is not set. AI features will not work. Ensure API_KEY environment variable is configured.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const getNutritionAdvice = async (userQuery: string, history: AIAssistantMessage[]): Promise<string> => {
  if (!ai) {
    return "عذرًا، خدمة مساعد الذكاء الاصطناعي غير متاحة حاليًا بسبب مشكلة في الإعدادات.";
  }

  const contents = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : msg.role,
    parts: [{ text: msg.content }]
  }));
  contents.push({ role: 'user', parts: [{ text: userQuery }] });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: GEMINI_NUTRITION_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Provide a more specific error message if possible
    if (error instanceof Error && error.message.includes('API key not valid')) {
        return "عذرًا، حدث خطأ في الاتصال بمساعد الذكاء الاصطناعي. قد يكون مفتاح API غير صالح.";
    }
    return "عذرًا، حدث خطأ أثناء محاولة الحصول على نصيحة غذائية. يرجى المحاولة مرة أخرى لاحقًا.";
  }
};
