#!/usr/bin/env node
/**
 * Minerva OS MCP Server
 *
 * Exposes Minerva OS data and browser automation as MCP tools for Claude
 * and other AI agents. Connects to Supabase for real-time data,
 * and Playwright for browser-based interactions.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_KEY=your_anon_key node dist/server.js
 *
 * Claude Desktop config (~/.claude/claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "minerva-os": {
 *         "command": "node",
 *         "args": ["/path/to/minerva-mcp/dist/server.js"],
 *         "env": {
 *           "SUPABASE_URL": "https://xxx.supabase.co",
 *           "SUPABASE_KEY": "your_anon_key"
 *         }
 *       }
 *     }
 *   }
 */


import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { dashboardTools } from './tools/dashboard.js';
import { clientsTools } from './tools/clients.js';
import { projectsTools } from './tools/projects.js';
import { tasksTools } from './tools/tasks.js';
import { pipelineTools } from './tools/pipeline.js';
import { billingTools } from './tools/billing.js';
import { reportsTools } from './tools/reports.js';
import { browserTools } from './tools/browser.js';
import { ticketsTools } from './tools/tickets.js';
import { approvalsTools } from './tools/approvals.js';
import { expensesTools } from './tools/expenses.js';
import { closeBrowser } from './browser-session.js';

const ALL_TOOLS = [
  ...dashboardTools,
  ...clientsTools,
  ...projectsTools,
  ...tasksTools,
  ...pipelineTools,
  ...billingTools,
  ...reportsTools,
  ...browserTools,
  ...ticketsTools,
  ...approvalsTools,
  ...expensesTools,
];

const toolMap = new Map(ALL_TOOLS.map(t => [t.name, t]));

const server = new Server(
  { name: 'minerva-os', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ALL_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args = {} } = request.params;
  const tool = toolMap.get(name);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    const result = await tool.handler(args as Record<string, unknown>);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[minerva-mcp] Server started — ${ALL_TOOLS.length} tools available`);
  console.error('[minerva-mcp] SUPABASE_URL:', process.env.SUPABASE_URL ? 'set' : 'NOT SET (browser tools only)');

  process.on('SIGINT', async () => {
    await closeBrowser();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[minerva-mcp] Fatal error:', err);
  process.exit(1);
});
