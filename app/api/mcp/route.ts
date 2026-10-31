/*
## Objective
Expose the Offside MCP tools over authenticated, stateless Streamable HTTP.

## Changelog
| # | date | details | reasoning | reference |
|---|---|---|---|---|
| 1 | 2026-10-31 | Added authenticated POST/GET/DELETE MCP handling for Vercel's Web Request runtime. | Allow remote MCP clients to call the shared tools without server-side session affinity or client database credentials. | Vercel MCP endpoint |

## Results/Takeaways
Set `MCP_AUTH_TOKEN` in the Vercel environment. Requests without a matching Bearer token are rejected; the endpoint is stateless and has no session persistence.
*/

import { timingSafeEqual } from "node:crypto";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createOffsideMcpServer } from "@/mcp/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const expectedToken = process.env.MCP_AUTH_TOKEN;
  if (!expectedToken) return false;

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;

  const supplied = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(expectedToken);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function unauthorized(): Response {
  return Response.json(
    { error: "Unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="offside-mcp"' } }
  );
}

async function handleMcpRequest(request: Request): Promise<Response> {
  if (!process.env.MCP_AUTH_TOKEN) {
    return Response.json({ error: "MCP endpoint is not configured" }, { status: 503 });
  }
  if (!isAuthorized(request)) return unauthorized();

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
