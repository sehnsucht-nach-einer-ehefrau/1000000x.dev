// app/api/generate-topic/route.ts
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
    const { topic, generationType, path } = await request.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "Invalid 'topic' parameter provided" },
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

    const masteryDescription = `An array of 10-15 tangential, contextually adjacent topics people often explore while learning or working with ${topic}. Focus on topics that come up WITHIN, not ALONGSIDE.`;
    const rabbitHoleDescription = `An array of 10-15 tangential, contextually adjacent topics people often explore while learning or working with ${topic}. Focus on topics that come up ALONGSIDE, not WITHIN.`;

    const promptDescription =
      generationType === "subjectMastery"
        ? masteryDescription
        : rabbitHoleDescription;

    const prompt = `
      You are an AI assistant that ONLY generates JSON.
      A user is exploring a topic. Their exploration path so far is: ${path.join(" -> ")}. They are currently on the topic "${topic}". Generate a list of related topics for them to explore next.

      You MUST generate a response that is ONLY a single, valid JSON object.
      Do not add any text before or after the JSON object.
      Your entire response must be nothing but the JSON structure specified below.

      The JSON schema you MUST adhere to is:
      {
        "topicTitle": "string", // The exact topic provided: "${topic}".
        "nextTopics": [ // ${promptDescription}
          {
            "title": "string", // Concise title for the related concept.
            "description": "string" // A one-sentence compelling description of the topic.
          }
        ]
      }

      Begin your raw JSON response now.
    `;

    const completion = await client.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("Received an empty response from the AI model.");
    }

    const parsedJson = JSON.parse(responseText);
    return NextResponse.json(parsedJson);
  } catch (error) {
    console.error(`Error in /api/generate-topic:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    const status = error instanceof OpenAI.APIError ? error.status : 500;
    return NextResponse.json(
      { error: `Failed to generate topic list`, details: errorMessage },
      { status },
    );
  }
}
