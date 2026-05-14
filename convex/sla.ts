import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listPolicies = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("slaPolicies")
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .collect();
  },
});

export const addPolicy = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    responseTime: v.number(),
    resolutionTime: v.number(),
    priority: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("slaPolicies", args);
  },
});
