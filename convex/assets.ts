import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMember } from "./auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("assets")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("assets").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    url: v.string(),
    projectId: v.optional(v.id("projects")),
    clientId: v.optional(v.id("clients")),
    uploadedAt: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.workspaceId) await requireWorkspaceMember(ctx, args.workspaceId);
    return await ctx.db.insert("assets", args);
  },
});

export const remove = mutation({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (asset?.workspaceId) await requireWorkspaceMember(ctx, asset.workspaceId);
    await ctx.db.delete(args.id);
  },
});
