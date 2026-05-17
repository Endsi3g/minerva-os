import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("finances")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("finances").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    type: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.string(),
    description: v.string(),
    tps: v.number(),
    tvq: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("finances", args);
  },
});
