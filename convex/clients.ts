import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    company: v.string(),
    contact: v.string(),
    email: v.string(),
    status: v.string(),
    monthlyValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clients", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    status: v.optional(v.string()),
    contact: v.optional(v.string()),
    email: v.optional(v.string()),
    monthlyValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});
