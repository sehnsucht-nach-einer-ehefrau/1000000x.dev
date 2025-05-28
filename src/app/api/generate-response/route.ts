// app/api/generate-response/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.DEEPSEEK_API_KEY) {
      // This is your OpenRouter API Key
      throw new Error("DEEPSEEK_API_KEY (OpenRouter API Key) not configured");
    }
    openaiClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.DEEPSEEK_API_KEY,
      // No defaultHeaders needed if you don't have site URL/name
    });
  }
  return openaiClient;
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Invalid query provided" },
        { status: 400 }
      );
    }

    const client = getOpenAIClient();

    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-chat:free", // Using a general chat model from DeepSeek on OpenRouter
      messages: [
        {
          role: "user",
          content: `Generate a comprehensive explanation about: ${query}. Focus on providing the most detail about that specific subject, and do not diverge to other subjects. Do not talk hallucinate. Be incredibly detailed and provide all information relevant to the subject without diverging to other subjects.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ content });
  } catch (error) {
    console.error(
      "Error in /api/generate-response (OpenRouter/DeepSeek):",
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    // Check if the error is from OpenAI SDK for more specific details
    if (error instanceof OpenAI.APIError) {
      console.error(
        "OpenAI APIError:",
        error.status,
        error.message,
        error.code,
        error.type
      );
      return NextResponse.json(
        { error: "OpenAI API Error", details: error.message, code: error.code },
        { status: error.status || 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate AI response", details: errorMessage },
      { status: 500 }
    );
  }
}
