import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, streamText, ModelMessage } from "ai";
import { buildSystemPrompt, runAgentLoop, AgentStep } from "@/lib/agent-core";

// Configure OpenRouter via OpenAI-compatible provider
const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "FPL Agent",
  },
});

type Message = ModelMessage;

// Model configuration for free models
const FREE_MODELS = {
  gemma: "google/gemma-2-9b-it:free",
  llama: "meta-llama/llama-3-8b-instruct:free",
  qwen: "qwen/qwen-2-7b-instruct:free",
};

export type AgentModel = keyof typeof FREE_MODELS;

export interface AgentChatOptions {
  model?: AgentModel;
  maxIterations?: number;
}

export interface AgentResponse {
  finalAnswer: string;
  steps: AgentStep[];
  model: string;
  iterations: number;
}

// Create the agent model instance
function getModel(modelType: AgentModel = "gemma") {
  const modelName = FREE_MODELS[modelType];
  return openrouter(modelName);
}

// Main agent chat function with streaming support
export async function runAgentChat(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  options: AgentChatOptions = {}
): Promise<AgentResponse> {
  const { model: modelType = "gemma", maxIterations = 5 } = options;
  const model = getModel(modelType);
  
  const systemPrompt = buildSystemPrompt();
  
  // Build messages array
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }) as Message),
    { role: "user", content: userMessage },
  ];
  
  // Custom completion function for the agent loop
  const generateCompletion = async (msgs: Array<{ role: string; content: string }>): Promise<string> => {
    const result = await generateText({
      model,
      messages: msgs as Message[],
      temperature: 0.3, // Lower temperature for more deterministic tool calls
    });
    return result.text;
  };
  
  // Run the agent loop
  const { steps, finalAnswer } = await runAgentLoop(
    messages.map((m) => ({ role: m.role, content: String(m.content) })),
    generateCompletion,
    { maxIterations, model: FREE_MODELS[modelType] }
  );
  
  return {
    finalAnswer,
    steps,
    model: FREE_MODELS[modelType],
    iterations: steps.length,
  };
}

// Streaming version for real-time UI updates
export async function streamAgentChat(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  options: AgentChatOptions = {}
) {
  const { model: modelType = "gemma", maxIterations = 5 } = options;
  const model = getModel(modelType);
  
  const systemPrompt = buildSystemPrompt();
  
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }) as Message),
    { role: "user", content: userMessage },
  ];
  
  // For streaming, we'll stream each step of the agent loop
  // This is a simplified version - full streaming of multi-step agents is complex
  return streamText({
    model,
    messages,
    temperature: 0.3,
  });
}

// Simple single-turn query (no agent loop) - useful for simple questions
export async function quickQuery(
  userMessage: string,
  modelType: AgentModel = "gemma"
): Promise<string> {
  const model = getModel(modelType);
  
  const systemPrompt = `You are an FPL data analyst. Answer the user's question concisely and accurately. If you need to query the database, provide the SQL query they should run.

${buildSystemPrompt()}

Keep your answers focused and actionable.`;

  const result = await generateText({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
  });
  
  return result.text;
}
