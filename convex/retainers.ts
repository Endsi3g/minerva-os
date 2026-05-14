import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("retainers");
    if (args.workspaceId) {
      q = q.filter((q) => q.eq(q.field("workspaceId"), args.workspaceId));
    }
    return await q.order("desc").collect();
  },
});

export const add = mutation({
  args: {
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
