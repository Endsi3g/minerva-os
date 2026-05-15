import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("fulfillment")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId!))
        .collect();
    }
    return await ctx.db.query("fulfillment").collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("fulfillment"),
    status: v.string(),
    progress: v.number(),
    checklist: v.array(v.object({ item: v.string(), done: v.boolean() })),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});
