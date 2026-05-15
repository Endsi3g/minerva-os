import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("deals")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("deals").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    company: v.string(),
    contact: v.string(),
    email: v.string(),
    value: v.number(),
    stage: v.string(),
    notes: v.optional(v.string()),
    lastContact: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("deals", args);
  },
});

export const updateStage = mutation({
  args: {
    id: v.id("deals"),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { stage: args.stage });
  },
});

export const remove = mutation({
  args: { id: v.id("deals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
