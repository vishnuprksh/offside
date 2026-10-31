/*
## Objective
Expose the Offside MCP tools over public, stateless Streamable HTTP.

## Changelog
| # | date | details | reasoning | reference |
|---|---|---|---|---|
| 1 | 2026-10-31 | Added POST/GET/DELETE MCP handling for Vercel's Web Request runtime. | Allow remote MCP clients to call the shared tools without server-side session affinity or client database credentials. | Vercel MCP endpoint |
| 2 | 2026-10-31 | Removed Bearer-token authentication from the hosted MCP route. | Allow compatible remote clients to connect without configuring a token; endpoint and tools are publicly callable. | User request |

## Results/Takeaways
The endpoint is public and requires no authentication. Anyone who knows its URL can invoke the read-only tools. The route is stateless and has no session persistence.
*/

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createOffsideMcpServer } from "@/mcp/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleMcpRequest(request: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createOffsideMcpServer();

  try {
    await server.connect(transport);
    return await transport.handleRequest(request);
  } finally {
    await transport.close();
    await server.close();
  }
}

export const GET = handleMcpRequest;
export const POST = handleMcpRequest;
export const DELETE = handleMcpRequest;
