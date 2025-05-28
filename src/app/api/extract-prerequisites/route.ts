// app/api/extract-prerequisites/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY (OpenRouter API Key) not configured");
    }
    openaiClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }
  return openaiClient;
}

export async function POST(request: Request) {
  try {
    const { content, topic } = await request.json();

    if (
      !content ||
      typeof content !== "string" ||
      !topic ||
      typeof topic !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid content or topic provided" },
        { status: 400 }
      );
    }

    const client = getOpenAIClient();

    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-chat:free", // This model should be capable enough
      messages: [
        {
          role: "user",
          content: `Based on the following content about "${topic}" generate more topics that relate. They shouldn't necessarily be 'prerequisites' but extra information about the topic or information that the topic leads to. For example, if the user inputs "File Descriptors", an appropriate response would be ["File Descriptor Table", "Inodes", "Open File Table", "Process Control Block"] or something among those lines. Content: """${content}""" Format your response STRICTLY as a JSON array of strings, with no other text, explanations, or Markdown. For example: ["Concept 1", "Concept 2", "Concept 3"]`,
        },
      ],
      // For OpenRouter with OpenAI SDK, response_format might not be directly usable this way
      // or might depend on the underlying model's support via OpenRouter.
      // Good prompting is key for JSON output.
    });

    let prerequisites: string[] = [];
    const responseContent = completion.choices[0]?.message?.content;

    if (responseContent) {
      try {
        const parsed = JSON.parse(responseContent);
        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === "string")
        ) {
          prerequisites = parsed;
        } else {
          console.warn(
            "OpenRouter/DeepSeek response for prerequisites was not a valid JSON array of strings, attempting fallback:",
            responseContent
          );
          prerequisites = responseContent
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p.length > 0 && p.length < 100);
        }
      } catch (parseError) {
        console.warn(
          "Failed to parse prerequisites as JSON from OpenRouter/DeepSeek, falling back to comma-separated:",
          parseError,
          "\nResponse was:",
          responseContent
        );
        prerequisites = responseContent
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p.length > 0 && p.length < 100);
      }
    }

    return NextResponse.json({ prerequisites });
  } catch (error) {
    console.error(
      "Error in /api/extract-prerequisites (OpenRouter/DeepSeek):",
      error
    );
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
      { error: "Failed to extract prerequisites", details: errorMessage },
      { status: 500 }
    );
  }
}
