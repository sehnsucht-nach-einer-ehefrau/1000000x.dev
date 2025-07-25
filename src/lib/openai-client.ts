// lib/openai-client.ts
import OpenAI from "openai";

/**
 * Returns a new Groq API client.
 * @param apiKey - An optional user-provided API key.
 * If not provided, it falls back to the GROQ_API_KEY environment variable.
 */
export function getGroqClient(apiKey?: string | null) {
  const key = apiKey || process.env.GROQ_API_KEY;

  if (!key) {
    throw new Error(
      "Groq API key is not configured. Please provide one or set GROQ_API_KEY.",
    );
  }

  // The client points to Groq's OpenAI-compatible endpoint
  return new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: key,
  });
}
