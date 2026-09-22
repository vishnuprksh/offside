import { executeSafeQuery, getSchemaPrompt } from "@/lib/agent-db";

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface AgentStep {
  thought: string;
  toolCalls?: ToolCall[];
  toolResults?: any[];
  finalAnswer?: string;
}

export interface AgentConfig {
  maxIterations: number;
  model: string;
}

const DEFAULT_CONFIG: AgentConfig = {
  maxIterations: 5,
  model: "google/gemma-2-9b-it:free",
};

// Tool definitions for the agent
export const TOOLS = [
  {
    name: "execute_sql",
    description: "Execute a read-only SQL query against the FPL database. Use this to retrieve player stats, predictions, fixture difficulties, or perform analysis.",
    parameters: {
      type: "object",
      properties: {
        sql: {
          type: "string",
          description: "The SQL SELECT query to execute. Must be read-only (SELECT only).",
        },
        explanation: {
          type: "string",
          description: "Brief explanation of what this query does and why you're running it.",
        },
      },
      required: ["sql"],
    },
  },
  {
    name: "analyze_results",
    description: "Analyze query results and provide insights. Use this after executing SQL queries to synthesize findings.",
    parameters: {
      type: "object",
      properties: {
        data: {
          type: "array",
          description: "The data from previous query results to analyze.",
        },
        question: {
          type: "string",
          description: "The original question or analysis goal.",
        },
      },
      required: ["data", "question"],
    },
  },
];

// System prompt for the agent
export function buildSystemPrompt(): string {
  return `You are an intelligent FPL (Fantasy Premier League) data analyst agent. Your role is to help users answer questions about FPL players, teams, fixtures, and predictions by querying the database and providing insightful analysis.

${getSchemaPrompt()}

## How You Work

You operate in a ReAct (Reasoning + Acting) loop:
1. **Think**: Analyze the user's question and determine what information you need
2. **Act**: Call tools to gather information (execute SQL queries)
3. **Observe**: Review the results from your tool calls
4. **Repeat** until you have enough information to answer
5. **Respond**: Provide a clear, actionable answer with supporting data

## Available Tools

1. **execute_sql**: Run a SELECT query to retrieve data from the database
   - Always explain WHY you're running each query
   - Keep queries focused and use LIMIT to avoid overwhelming results
   - Join tables when needed (players + predictions on player_id)
   
2. **finalize**: When you have enough information, provide your final answer
   - Summarize key findings clearly
   - Include relevant numbers and statistics
   - Make actionable recommendations if appropriate

## Response Format

For each step, respond with JSON in this exact format:
{
  "thought": "Your reasoning about what to do next",
  "tool_calls": [
    {
      "name": "execute_sql",
      "arguments": {
        "sql": "SELECT ...",
        "explanation": "Why you're running this query"
      }
    }
  ]
}

When you're ready to give the final answer:
{
  "thought": "I now have enough information to answer the user's question",
  "final_answer": "Your comprehensive answer here with data and insights"
}

## Important Rules

- ONLY run SELECT queries - never INSERT, UPDATE, DELETE, or modify data
- Always limit result sets appropriately (use LIMIT 10-50 for exploratory queries)
- Be efficient - try to answer in as few steps as possible (max ${DEFAULT_CONFIG.maxIterations} iterations)
- If a query fails, learn from the error and try a different approach
- Prices are in £M (millions), e.g., 14.0 means £14.0M
- Position codes: 1=GKP (goalkeeper), 2=DEF (defender), 3=MID (midfielder), 4=FWD (forward)
- prob_gt_5 is the probability (0-100) that a player scores more than 5 points in a gameweek

## Example Interactions

User: "Who are the top 5 midfielders by form?"
Agent thought: "I need to query the players table, filter by position MID, sort by form descending, and limit to 5."
Agent tool_calls: [{name: "execute_sql", arguments: {sql: "SELECT web_name, team_name, form, total_points FROM fpl.players WHERE position = 'MID' ORDER BY form DESC LIMIT 5", explanation: "Get top 5 midfielders by form"}}]

User: "Which players have the best fixtures in the next 3 gameweeks?"
Agent thought: "I need to look at fixture_difficulties for upcoming matches and find teams with low difficulty ratings."
Agent tool_calls: [{name: "execute_sql", arguments: {sql: "SELECT event, team_h_name, team_a_name, prob_home_win, prob_away_win FROM fpl.fixture_difficulties WHERE finished = false ORDER BY event LIMIT 15", explanation: "Get upcoming fixtures with win probabilities"}}]

Remember: Think step-by-step, be efficient with queries, and always provide actionable insights!`;
}

// Parse tool calls from LLM response
export function parseToolCalls(response: string): { toolCalls: ToolCall[]; finalAnswer?: string; thought: string } {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { 
        toolCalls: [], 
        thought: response,
        finalAnswer: response 
      };
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (parsed.final_answer) {
      return {
        toolCalls: [],
        finalAnswer: parsed.final_answer,
        thought: parsed.thought || "",
      };
    }
    
    const toolCalls: ToolCall[] = parsed.tool_calls || parsed.toolCalls || [];
    return {
      toolCalls,
      thought: parsed.thought || "",
    };
  } catch (e) {
    // If JSON parsing fails, treat as final answer
    return {
      toolCalls: [],
      thought: "",
      finalAnswer: response,
    };
  }
}

// Execute a tool call
export async function executeTool(toolCall: ToolCall): Promise<any> {
  switch (toolCall.name) {
    case "execute_sql": {
      const sql = toolCall.arguments?.sql;
      if (!sql) {
        return { success: false, error: "No SQL query provided" };
      }
      return await executeSafeQuery(sql);
    }
    case "analyze_results": {
      // This is handled by the LLM in the next iteration
      return toolCall.arguments;
    }
    default:
      return { success: false, error: `Unknown tool: ${toolCall.name}` };
  }
}

// Main agent loop
export async function runAgentLoop(
  messages: Array<{ role: string; content: string }>,
  generateCompletion: (msgs: Array<{ role: string; content: string }>) => Promise<string>,
  config: AgentConfig = DEFAULT_CONFIG
): Promise<{ steps: AgentStep[]; finalAnswer: string }> {
  const steps: AgentStep[] = [];
  
  for (let iteration = 0; iteration < config.maxIterations; iteration++) {
    // Generate completion
    const response = await generateCompletion(messages);
    
    const { toolCalls, finalAnswer, thought } = parseToolCalls(response);
    
    const step: AgentStep = {
      thought,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finalAnswer,
    };
    
    steps.push(step);
    
    // If we have a final answer, we're done
    if (finalAnswer) {
      return { steps, finalAnswer };
    }
    
    // Execute tool calls
    if (toolCalls.length > 0) {
      const toolResults = await Promise.all(toolCalls.map(executeTool));
      step.toolResults = toolResults;
      
      // Add tool results to messages for next iteration
      const toolResultContent = toolResults
        .map((result, idx) => {
          const toolName = toolCalls[idx]?.name || "unknown";
          return `Tool: ${toolName}\nResult: ${JSON.stringify(result, null, 2)}`;
        })
        .join("\n\n");
      
      messages.push({
        role: "user",
        content: toolResultContent,
      });
    } else {
      // No tool calls and no final answer - force conclusion
      messages.push({
        role: "user",
        content: "Please provide your final answer based on the information gathered so far.",
      });
    }
  }
  
  // Max iterations reached - force final answer
  const finalResponse = await generateCompletion([
    ...messages,
    {
      role: "system",
      content: "You have reached the maximum number of iterations. Please provide your best final answer based on the information you have gathered.",
    },
  ]);
  
  const { finalAnswer } = parseToolCalls(finalResponse);
  
  return {
    steps,
    finalAnswer: finalAnswer || "Unable to complete analysis within iteration limit.",
  };
}
