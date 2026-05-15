/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Keeping this for compatibility but updating it to use the new pattern
export function getGeminiModel(config?: { model?: string }) {
  const modelName = config?.model || "gemini-3-flash-preview";
  
  return {
    generateContent: async (params: { contents: any; generationConfig?: any; config?: any }) => {
      try {
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelName,
            contents: params.contents,
            config: params.generationConfig || params.config
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to generate content from server");
        }

        const data = await response.json();
        return {
          text: data.text,
          candidates: data.candidates,
          usageMetadata: data.usageMetadata,
          response: {
            text: () => data.text,
            candidates: data.candidates
          }
        };
      } catch (error) {
        console.error("Gemini Utility Error:", error);
        throw error;
      }
    }
  };
}
