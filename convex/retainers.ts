import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("retainers")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("retainers").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    clientId: v.id("clients"),
    amount: v.number(),
    cycle: v.string(),
    status: v.string(),
    startDate: v.string(),
    renewalDate: v.string(),
    hoursIncluded: v.number(),
    hoursUsed: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("retainers", args);
  },
});
