import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Enhances the provided text for a construction site diary using the Gemini API.
 *
 * @param {string} text - The original activity description text.
 * @returns {Promise<string>} - The AI-enhanced text.
 * @throws {Error} - Throws an error if the API key is missing or the API call fails.
 */
export async function enhanceActivityDescription(text) {
  if (!text || text.trim() === '') {
    return text;
  }

  // Handle environments where import.meta is not defined
  let apiKey = undefined;
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  }

  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY environment variable. Cannot enhance text.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Use gemini-2.5-flash as the recommended model for general text tasks
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are a professional construction site manager.
Your task is to take the following site diary activity description and improve it.
Please fix all spelling and grammar errors, remove any redundancies, and maintain an extreme level of professionalism suitable for a construction environment.
Do not add any facts that are not present in the original text, but rewrite the text clearly.
Only return the enhanced text. Do not include any conversational filler.

Original text:
${text}
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return responseText.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to enhance text using AI. Please try again later.");
  }
}
