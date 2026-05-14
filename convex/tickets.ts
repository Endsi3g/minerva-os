import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("tickets")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId!))
        .collect();
    }
    return await ctx.db.query("tickets").collect();
  },
});

export const get = query({
  args: { id: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const add = mutation({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    clientId: v.id("clients"),
    subject: v.string(),
    description: v.string(),
    priority: v.string(),
    category: v.string(),
    assignedTo: v.optional(v.string()),
    slaDeadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tickets", {
      ...args,
      status: "open",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tickets"),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    priority: v.optional(v.string()),
    slaDeadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});
