/*
## Objective
Run Offside's shared MCP tools locally over stdio.

## Changelog
| # | date | details | reasoning | reference |
|---|---|---|---|---|
| 1 | 2026-10-31 | Switched tool registration to the shared server factory. | Keep the local and Vercel HTTP transports on the same tool definitions. | Hosted MCP endpoint |

## Results/Takeaways
Use `npm run mcp` for local MCP clients; remote clients use `/api/mcp` instead.
*/

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createOffsideMcpServer } from "./tools";

const transport = new StdioServerTransport();
async function main() {
  const server = createOffsideMcpServer();
  await server.connect(transport);
}

main();
