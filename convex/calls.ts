import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("calls").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    attendees: v.array(v.string()),
    status: v.string(),
    prepChecklist: v.array(v.object({ task: v.string(), completed: v.boolean() })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("calls", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("calls"),
    summary: v.optional(v.string()),
    prepChecklist: v.optional(v.array(v.object({ task: v.string(), completed: v.boolean() }))),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});
