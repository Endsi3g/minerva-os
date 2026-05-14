import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("services")
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .collect();
    }
    return await ctx.db.query("services").collect();
  },
});

export const add = mutation({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    name: v.string(),
    description: v.string(),
    basePrice: v.number(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("services", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("services"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    basePrice: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("services") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Packages
export const listPackages = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("packages")
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .collect();
    }
    return await ctx.db.query("packages").collect();
  },
});

export const addPackage = mutation({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    name: v.string(),
    description: v.string(),
    services: v.array(v.id("services")),
    totalPrice: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("packages", args);
  },
});
