"use client";

import { useState, useRef, useEffect } from "react";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  steps?: AgentStep[];
  model?: string;
  iterations?: number;
}

export interface AgentStep {
  thought: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
  toolResults?: any[];
  finalAnswer?: string;
}

interface SidebarAgentProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarAgent({ isOpen, onClose }: SidebarAgentProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AgentMessage = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
          options: {
            model: "gemma" as const,
            maxIterations: 5,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get agent response");
      }

      const data = await response.json();

      const assistantMessage: AgentMessage = {
        role: "assistant",
        content: data.finalAnswer,
        steps: data.steps,
        model: data.model,
        iterations: data.iterations,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err.message}. Please make sure OPENROUTER_API_KEY is configured in your environment variables.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[450px] bg-[#0b1221] border-l border-[var(--border)] shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[#0d1526]">
        <div>
          <h2 className="text-lg font-bold text-white">FPL Analyst Agent</h2>
          <p className="text-xs text-[var(--muted)]">Ask questions about players, fixtures, and predictions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-2 hover:bg-[var(--border)] rounded-lg transition-colors"
            title="Clear chat"
          >
            <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--border)] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-[var(--muted)] mt-20">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-sm mb-2">Hi! I'm your FPL data analyst.</p>
            <p className="text-xs">Ask me questions like:</p>
            <ul className="text-xs mt-3 space-y-2 text-left max-w-xs mx-auto">
              <li className="bg-[#0d1526] p-2 rounded">Who are the top 5 midfielders by form?</li>
              <li className="bg-[#0d1526] p-2 rounded">Which teams have the easiest fixtures next gameweek?</li>
              <li className="bg-[#0d1526] p-2 rounded">Show me defenders with high clean sheet probability</li>
            </ul>
          </div>
        ) : (
          messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-[var(--accent)] text-[#04140b]"
                    : "bg-[#0d1526] border border-[var(--border)]"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Show reasoning steps for assistant messages */}
                {message.steps && message.steps.length > 0 && (
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer text-[var(--muted)] hover:text-white transition-colors">
                      View reasoning ({message.steps.length} step{message.steps.length !== 1 ? "s" : ""})
                    </summary>
                    <div className="mt-2 space-y-3">
                      {message.steps.map((step, stepIdx) => (
                        <div key={stepIdx} className="bg-[#0b1221] p-3 rounded-lg border border-[var(--border)]">
                          <div className="font-medium text-[var(--muted)] mb-1">
                            Step {stepIdx + 1}: {step.thought}
                          </div>
                          {step.toolCalls && step.toolCalls.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-[var(--muted)] mb-1">Tool calls:</div>
                              {step.toolCalls.map((tool, toolIdx) => (
                                <div key={toolIdx} className="bg-[#0d1526] p-2 rounded font-mono text-xs overflow-x-auto">
                                  <div className="text-emerald-400">{tool.name}</div>
                                  {tool.arguments?.sql && (
                                    <pre className="mt-1 text-sky-300">{tool.arguments.sql}</pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {step.toolResults && step.toolResults.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-[var(--muted)] mb-1">Results:</div>
                              {step.toolResults.map((result: any, resultIdx) => (
                                <div key={resultIdx} className="bg-[#0d1526] p-2 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                                  <pre className="text-amber-300">
                                    {result.success 
                                      ? `${result.data?.length || 0} rows returned`
                                      : `Error: ${result.error}`
                                    }
                                  </pre>
                                  {result.data && result.data.length > 0 && (
                                    <table className="mt-2 w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-[var(--border)]">
                                          {Object.keys(result.data[0]).map((key) => (
                                            <th key={key} className="text-left py-1 pr-3 text-[var(--muted)]">{key}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {result.data.slice(0, 5).map((row: any, rowIdx: any) => (
                                          <tr key={rowIdx} className="border-b border-[var(--border)]/50">
                                            {Object.values(row).map((val: any, colIdx: any) => (
                                              <td key={colIdx} className="py-1 pr-3 truncate max-w-[150px]">{String(val)}</td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                
                {/* Model info */}
                {message.model && (
                  <div className="mt-2 text-xs text-[var(--muted)]">
                    {message.model} • {message.iterations} iteration{message.iterations !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#0d1526] border border-[var(--border)] rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center">
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--border)] bg-[#0d1526]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about FPL players, fixtures, or stats..."
            disabled={isLoading}
            className="flex-1 bg-[#0b1221] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-[var(--accent)] text-[#04140b] font-bold px-5 py-3 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">
          Powered by OpenRouter free models • Max 5 reasoning steps
        </p>
      </div>
    </div>
  );
}
