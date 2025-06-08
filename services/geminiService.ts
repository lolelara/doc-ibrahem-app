
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { CalorieFormData, ActivityLevel, CalorieGoal } from '../types';
import { ARABIC_STRINGS } from '../constants';

// Ensure API_KEY is available via process.env.API_KEY
// The environment variable should be set in the build/deployment environment.
// For local development, you might use a .env file with a tool like dotenv,
// but for this specific setup, we assume it's globally available as process.env.API_KEY.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error("Gemini API Key is not configured. Calorie calculator will not work.");
}


const getActivityLevelArabic = (level: ActivityLevel): string => {
  return ARABIC_STRINGS.activityLevels[level] || String(level);
};

const getGoalArabic = (goal: CalorieGoal): string => {
  return ARABIC_STRINGS.calorieGoals[goal] || String(goal);
};

export const calculateCaloriesWithGemini = async (formData: CalorieFormData): Promise<string> => {
  if (!ai) {
    return Promise.reject("Gemini API client not initialized. API Key might be missing.");
  }

  const genderArabic = formData.gender === 'male' ? ARABIC_STRINGS.male : ARABIC_STRINGS.female;
  const activityLevelArabic = getActivityLevelArabic(formData.activityLevel);
  const goalArabic = getGoalArabic(formData.goal);

  const prompt = `
    أنت خبير تغذية. برجاء حساب السعرات الحرارية اليومية المطلوبة لشخص بناءً على البيانات التالية:
    - العمر: ${formData.age} سنة
    - الوزن: ${formData.weight} كجم
    - الطول: ${formData.height} سم
    - الجنس: ${genderArabic}
    - مستوى النشاط: ${activityLevelArabic}
    - الهدف: ${goalArabic}

    قدم الناتج كرقم يمثل عدد السعرات الحرارية فقط، بدون أي نص إضافي. على سبيل المثال: 2500
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17', // Use the specified model
      contents: prompt,
      // config: { temperature: 0.2 } // Optional: Lower temperature for more deterministic output for a calculator
    });
    
    const textResponse = response.text.trim();
    // Validate if the response is a number
    if (/^\d+$/.test(textResponse)) {
      return textResponse;
    } else {
      console.warn("Gemini response was not a plain number:", textResponse);
      // Fallback or attempt to extract number if model adds minor text
      const numberMatch = textResponse.match(/\d+/);
      if (numberMatch && numberMatch[0]) {
        return numberMatch[0];
      }
      return Promise.reject("لم يتمكن الذكاء الاصطناعي من حساب السعرات. حاول تعديل المدخلات.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Check for specific GoogleGenAIError if needed for more granular error handling
    // if (error instanceof GoogleGenAIError) { ... }
    return Promise.reject("حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي لحساب السعرات.");
  }
};
