// lib/ai-service.ts

export async function generateAIResponse(query: string): Promise<string> {
  try {
    const response = await fetch("/api/generate-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `API request failed with status ${response.status}`
      );
    }
    const data = await response.json();
    return data.content || "";
  } catch (error) {
    console.error("Error generating AI response (client):", error);
    return `Error generating content: ${
      error instanceof Error ? error.message : "Please try again."
    }`;
  }
}

export async function extractPrerequisites(
  content: string,
  topic: string
): Promise<string[]> {
  try {
    const response = await fetch("/api/extract-prerequisites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, topic }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `API request failed with status ${response.status}`
      );
    }
    const data = await response.json();
    return data.prerequisites || [];
  } catch (error) {
    console.error("Error extracting prerequisites (client):", error);
    return [];
  }
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export async function continueChatOnTopic(
  topicTitle: string,
  topicContent: string,
  chatHistory: Omit<ChatTurn, "timestamp">[], // Send history without timestamp
  userMessage: string
): Promise<string> {
  try {
    const response = await fetch("/api/chat-on-topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicTitle,
        topicContent,
        chatHistory,
        userMessage,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `API request failed with status ${response.status}`
      );
    }
    const data = await response.json();
    return data.response || "Sorry, I couldn't get a response.";
  } catch (error) {
    console.error("Error continuing chat (client):", error);
    return `Error getting chat response: ${
      error instanceof Error ? error.message : "Please try again."
    }`;
  }
}
