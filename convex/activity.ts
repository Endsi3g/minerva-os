import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activity")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(10);
  },
});

export const add = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    user: v.string(),
    action: v.string(),
    targetName: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activity", {
      ...args,
      timestamp: new Date().toISOString(),
    });
  },
});
export const logSystemEvent = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    action: v.string(),
    targetName: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activity", {
      user: "System",
      ...args,
      timestamp: new Date().toISOString(),
    });
  },
});
