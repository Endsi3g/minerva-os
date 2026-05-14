import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";



export const runAgent = action({
  args: {
    workspaceId: v.id("workspaces"),
    agentId: v.id("agents"),
    threadId: v.id("agentThreads"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get agent and thread context
    const agent = await ctx.runQuery(api.agents.getAgent, { agentId: args.agentId });
    if (!agent) throw new Error("Agent not found");

    // 2. Save user message
    await ctx.runMutation(api.agents.saveMessage, {
      workspaceId: args.workspaceId,
      threadId: args.threadId,
      role: "user",
      content: args.message,
    });

    // 3. Get thread history
    const history = await ctx.runQuery(api.agents.getThreadMessages, { threadId: args.threadId });

    // 4. Call Anthropic via fetch (to avoid SDK issues in Convex sandbox)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 4096,
        system: agent.instructions,
        messages: history.map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
        tools: [
          {
            name: "suggest_action",
            description: "Suggest an action for the human to approve (e.g. create task, send email)",
            input_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                actionType: { type: "string" },
                actionData: { type: "object" },
                reasoning: { type: "string" },
              },
              required: ["title", "description", "actionType", "actionData"],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();

    // 5. Handle response and tool calls
    for (const content of data.content) {
      if (content.type === "text") {
        await ctx.runMutation(api.agents.saveMessage, {
          workspaceId: args.workspaceId,
          threadId: args.threadId,
          role: "assistant",
          content: content.text,
        });
      }

      if (content.type === "tool_use" && content.name === "suggest_action") {
        const input = content.input as any;
        await ctx.runMutation(api.agents.createSuggestion, {
          workspaceId: args.workspaceId,
          agentId: args.agentId,
          ...input,
        });
      }
    }

    return { success: true };
  },
});

// Helper mutations and queries
export const getAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.agentId);
  },
});

export const saveMessage = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    threadId: v.id("agentThreads"),
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("agentMessages", {
      workspaceId: args.workspaceId,
      threadId: args.threadId,
      role: args.role,
      content: args.content,
      timestamp: new Date().toISOString(),
    });
  },
});

export const getThreadMessages = query({
  args: { threadId: v.id("agentThreads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
  },
});

export const createSuggestion = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    agentId: v.id("agents"),
    title: v.string(),
    description: v.string(),
    actionType: v.string(),
    actionData: v.any(),
    reasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("agentSuggestions", {
      ...args,
      status: "pending",
    });
    
    // Also log to audit
    await ctx.db.insert("agentAudit", {
      workspaceId: args.workspaceId,
      agentId: args.agentId,
      action: "suggested_action",
      details: { type: args.actionType, title: args.title },
      timestamp: new Date().toISOString(),
    });
  },
});

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .collect();
  },
});

export const getAudit = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentAudit")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(50);
  },
});

export const getSuggestions = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentSuggestions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

export const approveSuggestion = mutation({
  args: { suggestionId: v.id("agentSuggestions") },
  handler: async (ctx, args) => {
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");

    await ctx.db.patch(args.suggestionId, { status: "approved" });

    await ctx.db.insert("agentAudit", {
      workspaceId: suggestion.workspaceId,
      agentId: suggestion.agentId,
      action: "suggestion_approved",
      details: { suggestionId: args.suggestionId, title: suggestion.title },
      timestamp: new Date().toISOString(),
    });
  },
});

export const rejectSuggestion = mutation({
  args: { suggestionId: v.id("agentSuggestions") },
  handler: async (ctx, args) => {
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");

    await ctx.db.patch(args.suggestionId, { status: "rejected" });

    await ctx.db.insert("agentAudit", {
      workspaceId: suggestion.workspaceId,
      agentId: suggestion.agentId,
      action: "suggestion_rejected",
      details: { suggestionId: args.suggestionId, title: suggestion.title },
      timestamp: new Date().toISOString(),
    });
  },
});

