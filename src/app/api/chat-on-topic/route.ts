// app/api/chat-on-topic/route.ts
import { NextResponse } from "next/server";
import { getGroqClient } from "@/lib/openai-client";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      topicTitle,
      topicContent,
      chatHistory,
      userMessage,
    }: { 
      topicTitle: string;
      topicContent: string;
      chatHistory: { role: "user" | "assistant"; content: string }[];
      userMessage: string;
    } = await request.json();

    if (!topicTitle || !topicContent || !chatHistory || !userMessage) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    const apiKey = user?.groqApiKey;


    if (!apiKey) {
      return NextResponse.json({ error: 'API key is missing.' }, { status: 400 });
    }

    const client = getGroqClient(apiKey);
    const model = "moonshotai/kimi-k2-instruct";

    const systemPrompt = `
      You are an expert AI assistant engaged in a conversation about "${topicTitle}".
      The user has been provided with the following core information about the topic:
      ---
      ${topicContent}
      ---
      Your role is to continue the conversation based on the chat history and the user's latest message.
      Provide helpful, insightful, and concise responses. Do not repeat information unless asked.
      Keep your responses focused on the topic at hand.
    `;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map((msg: { role: "user" | "assistant"; content: string }) => ({ role: msg.role, content: msg.content })),
      { role: "user", content: userMessage },
    ];

    const completion = await client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("Received an empty response from the AI model.");
    }

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error(`Error in /api/chat-on-topic:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    const status = error instanceof OpenAI.APIError ? error.status : 500;
    return NextResponse.json(
      { error: `Failed to continue chat`, details: errorMessage },
      { status },
    );
  }
}
