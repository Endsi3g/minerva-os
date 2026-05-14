import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("riskFlags")
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .collect();
    }
    return await ctx.db.query("riskFlags").collect();
  },
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("riskFlags")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const add = mutation({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    projectId: v.optional(v.id("projects")),
    clientId: v.optional(v.id("clients")),
    type: v.string(),
    severity: v.string(),
    summary: v.string(),
    details: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("riskFlags", {
      ...args,
      status: "active",
      createdAt: new Date().toISOString(),
    });
  },
});

export const resolve = mutation({
  args: {
    id: v.id("riskFlags"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});
