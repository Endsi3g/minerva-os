import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("milestones")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("milestones").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
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
