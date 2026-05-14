import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("milestones").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    dueDate: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("milestones", args);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("milestones"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});
