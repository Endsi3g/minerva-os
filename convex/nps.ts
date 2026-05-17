import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("npsResponses")
      .withIndex("by_workspace", q => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();
  },
});

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("npsResponses")
      .withIndex("by_client", q => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});

export const submit = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    clientId: v.id("clients"),
    score: v.number(),
    reason: v.optional(v.string()),
    suggestion: v.optional(v.string()),
    trigger: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.score < 0 || args.score > 10) throw new Error("Score must be between 0 and 10");
    return await ctx.db.insert("npsResponses", {
      ...args,
      respondedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("npsResponses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
