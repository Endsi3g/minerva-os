import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
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
