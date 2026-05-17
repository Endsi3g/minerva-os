import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// --- Agents ---

export const listAgents = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("agents")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId!))
        .collect();
    }
    return await ctx.db.query("agents").collect();
  },
});

export const listThreads = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("agentThreads")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId!))
        .collect();
    }
    return await ctx.db.query("agentThreads").collect();
  },
});

export const createThread = mutation({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    agentId: v.id("agents"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentThreads", {
      workspaceId: args.workspaceId,
      agentId: args.agentId,
      title: args.title,
      status: "active",
    });
  },
});

export const listSuggestions = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("agentSuggestions")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId!))
        .collect();
    }
    return await ctx.db.query("agentSuggestions").collect();
  },
});

export const approveSuggestion = mutation({
  args: { id: v.id("agentSuggestions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "approved" });
  },
});

export const rejectSuggestion = mutation({
  args: { id: v.id("agentSuggestions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "rejected" });
  },
});
