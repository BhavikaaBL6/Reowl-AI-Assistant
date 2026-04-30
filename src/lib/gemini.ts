/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { neuralKeyManager } from "./keyRotation";

export function getGenAI() {
  const apiKey = neuralKeyManager.getNextKey();
  if (!apiKey) {
    throw new Error("No GEMINI_API_KEY detected in environment. Please add it to your secrets.");
  }
  return new GoogleGenAI({ apiKey });
}

// Keeping this for compatibility but updating it to use the new pattern
export function getGeminiModel(config?: { model?: string }) {
  const genAI = getGenAI();
  const modelName = config?.model || "gemini-3-flash-preview";
  
  return {
    generateContent: async (params: { contents: any; generationConfig?: any; config?: any }) => {
      // The skill says ai.models.generateContent takes model name inside params
      return genAI.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: params.generationConfig || params.config
      });
    }
  };
}
