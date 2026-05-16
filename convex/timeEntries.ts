import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("timeEntries")
      .withIndex("by_workspace", q => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(200);
  },
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("timeEntries")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .order("desc")
      .take(100);
  },
});

export const listByUser = query({
  args: { userId: v.string(), workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("timeEntries")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .order("desc")
      .take(100);
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    description: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    billable: v.boolean(),
    hourlyRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("timeEntries", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("timeEntries"),
    description: v.optional(v.string()),
    billable: v.optional(v.boolean()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("timeEntries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
