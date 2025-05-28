// app/api/chat-on-topic/route.ts
import OpenAI from "openai"; // Use OpenAI SDK
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"; // Import correct type
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
    });
  }
  return openaiClient;
}

interface ChatMessageInputFromClient {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  try {
    const { topicTitle, topicContent, chatHistory, userMessage } =
      await request.json();

    if (
      !topicTitle ||
      typeof topicTitle !== "string" ||
      !topicContent ||
      typeof topicContent !== "string" ||
      !userMessage ||
      typeof userMessage !== "string" ||
      !Array.isArray(chatHistory)
    ) {
      return NextResponse.json(
        { error: "Invalid parameters provided" },
        { status: 400 }
      );
    }

    const client = getOpenAIClient();

    const systemPrompt = `You are a helpful AI assistant. The user is learning about the topic: "${topicTitle}".
Context about the topic:
"""
${topicContent}
"""
Focus your answers on this topic and its related concepts based on the provided context and chat history. Be as informative as possible.`;

    // Ensure messages conform to OpenAI's ChatCompletionMessageParam[]
    const messagesForAPI: ChatCompletionMessageParam[] = [
      // Use imported type
      { role: "system", content: systemPrompt },
      ...chatHistory.map(
        (msg: ChatMessageInputFromClient): ChatCompletionMessageParam => {
          if (msg.role === "user" || msg.role === "assistant") {
            return { role: msg.role, content: msg.content };
          }
          console.warn(
            `Unsupported role '${msg.role}' from client chat history, treating as 'user'.`
          );
          return { role: "user", content: msg.content };
        }
      ),
      { role: "user", content: userMessage },
    ];

    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-chat:free", // Using a general chat model from DeepSeek on OpenRouter
      messages: messagesForAPI,
    });

    const assistantResponse =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't process that request via OpenRouter/DeepSeek.";
    return NextResponse.json({ response: assistantResponse });
  } catch (error) {
    console.error("Error in /api/chat-on-topic (OpenRouter/DeepSeek):", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
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
      { error: "Failed to get chat response", details: errorMessage },
      { status: 500 }
    );
  }
}
