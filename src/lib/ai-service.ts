import Groq from "groq-sdk";
import { generateText } from "ai";

export async function generateAIResponse(query: string): Promise<string> {
  try {
    const groq = new Groq({
      apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    const text = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Generate a comprehensive but concise explanation about: ${query}. Focus on providing clear, factual information that covers the most important aspects.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    return text.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Error generating content. Please try again.";
  }
}

export async function extractPrerequisites(
  content: string,
  topic: string
): Promise<string[]> {
  try {
    const groq = new Groq({
      apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    const text = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Based on the following content about "${topic}", identify a maximum of 7 key prerequisite concepts that someone would need to understand to fully grasp this topic. Content: ${content} Format your response as a simple comma-separated list with no numbering, explanations, or additional text. For example: "Concept 1, Concept 2, Concept 3, Concept 4, Concept 5"`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const new_text = text.choices[0]?.message?.content;

    if (new_text == null) {
      return [];
    }

    // Parse the response into an array of keywords
    return (
      new_text
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0) || ""
    );
  } catch (error) {
    console.error("Error extracting prerequisites:", error);
    return [];
  }
}
