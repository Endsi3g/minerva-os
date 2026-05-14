import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("workspaces")
        .filter((q) => q.eq(q.field("orgId"), args.workspaceId))
        .collect();
    }
    return await ctx.db.query("workspaces").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const get = query({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    orgId: v.optional(v.id("organizations")),
    name: v.string(),
    slug: v.string(),
    branding: v.object({
      logo: v.optional(v.string()),
      primaryColor: v.string(),
      theme: v.string(),
    }),
    settings: v.object({
      currency: v.string(),
      language: v.string(),
      timezone: v.string(),
      taxRules: v.array(v.object({
        name: v.string(),
        rate: v.number(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workspaces", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("workspaces"),
    name: v.optional(v.string()),
    branding: v.optional(v.object({
      logo: v.optional(v.string()),
      primaryColor: v.string(),
      theme: v.string(),
    })),
    settings: v.optional(v.object({
      currency: v.string(),
      language: v.string(),
      timezone: v.string(),
      taxRules: v.array(v.object({
        name: v.string(),
        rate: v.number(),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});
