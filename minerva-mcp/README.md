# Minerva OS — MCP Server

Expose Minerva OS as an MCP (Model Context Protocol) server so **Claude Desktop**, **Claude Code**, or any MCP-compatible agent can manage your agency data and navigate the app.

## Tools available (21)

### Data tools (Convex HTTP)
| Tool | What it does |
|------|-------------|
| `get_dashboard_metrics` | KPIs: active projects, open tasks, pending approvals, revenue MTD, pipeline value |
| `list_clients` | All clients with status and monthly value |
| `create_client` | Create a new client |
| `list_projects` | All projects with health scores |
| `create_project` | Create a new project |
| `list_tasks` | Tasks filterable by status/priority |
| `create_task` | Create a new task |
| `list_deals` | Pipeline deals by stage |
| `create_deal` | Create a new deal |
| `list_invoices` | Invoices with status filter |
| `get_billing_summary` | Outstanding, overdue, collected MTD |
| `get_reports_summary` | Win rate, pipeline value, top clients by revenue |
| `list_agent_suggestions` | Pending AI suggestions awaiting approval |
| `get_risk_flags` | Active risk flags (overdue projects, invoices, stalled approvals) |

### Browser tools (Playwright)
| Tool | What it does |
|------|-------------|
| `navigate_to` | Open a page in the app (`/app/dashboard`, `/app/pipeline`, etc.) |
| `take_screenshot` | Capture current page as base64 PNG |
| `click_element` | Click an element by CSS selector |
| `fill_form` | Fill a form field |
| `get_page_content` | Get current page URL, title, and visible text |

## Setup

### 1. Build the server

```bash
cd minerva-mcp
npm install
npm run build
```

### 2. Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "minerva-os": {
      "command": "node",
      "args": ["/absolute/path/to/minerva-mcp/dist/server.js"],
      "env": {
        "CONVEX_URL": "https://your-deployment.convex.cloud",
        "MINERVA_APP_URL": "http://localhost:3000"
      }
    }
  }
}
```

### 3. Configure Claude Code

Add to your project's `.claude/settings.json` or `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "minerva-os": {
      "command": "node",
      "args": ["/absolute/path/to/minerva-mcp/dist/server.js"],
      "env": {
        "CONVEX_URL": "https://your-deployment.convex.cloud",
        "MINERVA_APP_URL": "http://localhost:3000"
      }
    }
  }
}
```

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CONVEX_URL` | Yes (data tools) | — | Your Convex deployment URL |
| `MINERVA_APP_URL` | No | `http://localhost:3000` | URL of the running Minerva OS app (for browser tools) |

## Example prompts

Once connected, you can ask Claude:

- *"Show me the dashboard metrics for Uprising Studio"*
- *"List all active clients and their monthly values"*
- *"Create a new client: Acme Corp, contact John Smith, john@acme.com"*
- *"What deals are in the proposal stage?"*
- *"Take a screenshot of the pipeline page"*
- *"What risk flags are currently active?"*
- *"Navigate to the billing page and tell me what you see"*
