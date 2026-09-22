import { runAgentChat } from "@/lib/agent-client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [], options = {} } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate OPENROUTER_API_KEY
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Run the agent
    const result = await runAgentChat(message, conversationHistory, options);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Agent API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process agent request" },
      { status: 500 }
    );
  }
}

// Handle streaming requests
export async function GET() {
  return NextResponse.json({
    message: "Use POST to send messages to the agent",
    usage: {
      endpoint: "/api/agent",
      method: "POST",
      body: {
        message: "Your question here",
        conversationHistory: [{ role: "user", content: "Previous message" }],
        options: {
          model: "gemma", // or "llama" or "qwen"
          maxIterations: 5,
        },
      },
    },
  });
}
