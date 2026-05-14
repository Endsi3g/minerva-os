import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("knowledgeBase")
        .filter((q: any) => q.eq(q.field("workspaceId"), args.workspaceId))
        .collect();
    }
    return await ctx.db.query("knowledgeBase").collect();
  },
});

export const get = query({
  args: { id: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const add = mutation({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("knowledgeBase", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("knowledgeBase"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    embedding: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
