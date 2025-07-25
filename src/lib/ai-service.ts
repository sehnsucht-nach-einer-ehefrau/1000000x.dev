// lib/ai-service.ts

export interface TopicGraphResponse {
  topicTitle: string;
  nextTopics: {
    title: string;
    description: string;
  }[];
}

export interface MainTopicResponse {
  topicTitle: string;
  mainExplanation: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/**
 * Generates only the main content for a given topic.
 * Now with robust error handling.
 */
export async function generateMainTopic(
  topic: string,
): Promise<MainTopicResponse> {
  try {
    const response = await fetch("/api/generate-main-topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ details: "Could not parse server error response." }));
      throw new Error(
        errorData.details ||
          errorData.error ||
          `Server responded with status: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in generateMainTopic service:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    // Return a structured error object that the UI can display gracefully
    return {
      topicTitle: `Error Generating: ${topic}`,
      mainExplanation: `### Generation Failed\n\nAn error occurred while generating content for this topic. Please try again later or select a different topic.\n\n**Details:**\n\`\`\`\n${errorMessage}\n\`\`\``,
    };
  }
}

/**
 * Generates ONLY the next explorable topics for a given parent topic.
 * Now with robust error handling.
 */
export async function generateTopicGraph(
  topic: string,
): Promise<TopicGraphResponse> {
  try {
    const response = await fetch("/api/generate-topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ details: "Could not parse server error response." }));
      throw new Error(
        errorData.details ||
          errorData.error ||
          `Server responded with status: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in generateTopicGraph service:", error);
    // On failure, return an empty array for nextTopics. The UI will handle this.
    return {
      topicTitle: topic,
      nextTopics: [],
    };
  }
}

/**
 * Continues a chat conversation on a specific topic.
 */
export async function continueChatOnTopic(
  topicTitle: string,
  topicContent: string,
  chatHistory: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
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
      const errorData = await response
        .json()
        .catch(() => ({ details: "Could not parse server error response." }));
      throw new Error(
        errorData.details ||
          errorData.error ||
          `Server responded with status: ${response.status}`,
      );
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error in continueChatOnTopic service:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Please try again.";
    return `Sorry, I encountered an error and couldn't process your request. Details: ${errorMessage}`;
  }
}
