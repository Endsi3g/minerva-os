import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("assets").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    size: v.number(),
    url: v.string(),
    projectId: v.optional(v.id("projects")),
    clientId: v.optional(v.id("clients")),
    uploadedAt: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assets", args);
  },
});

export const remove = mutation({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
