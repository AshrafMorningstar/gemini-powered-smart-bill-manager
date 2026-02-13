
import { GoogleGenAI, Type } from "@google/genai";
import { Bill, CodeReviewResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBillImage = async (base64Image: string, highAccuracy: boolean = false): Promise<Partial<Bill>> => {
  try {
    const modelName = highAccuracy ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image.split(',')[1] || base64Image
              }
            },
            {
              text: "Act as a specialized financial OCR. Extract: customerName, invoiceNumber, date (YYYY-MM-DD), dueDate (YYYY-MM-DD), currency (3-letter ISO), totalAmount, and items. Return ONLY JSON."
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI returned empty data.");
    return JSON.parse(text);
  } catch (error: any) {
    throw new Error(error.message || "Extraction failed.");
  }
};

export const performCodeReview = async (prompt: string, diff: string): Promise<CodeReviewResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `System Prompt: ${prompt}\n\nPR Diff:\n${diff}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            score: { type: Type.NUMBER },
            bugs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  file: { type: Type.STRING },
                  line: { type: Type.NUMBER },
                  message: { type: Type.STRING },
                  severity: { type: Type.STRING }
                }
              }
            },
            security: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  issue: { type: Type.STRING },
                  suggestion: { type: Type.STRING }
                }
              }
            },
            performance: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "score", "bugs", "security", "performance"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    throw new Error(error.message || "Code review simulation failed.");
  }
};
