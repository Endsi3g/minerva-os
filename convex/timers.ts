import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMember } from "./auth";

export const getActive = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activeTimers")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .unique();
  },
});

export const start = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const existing = await ctx.db
      .query("activeTimers")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return await ctx.db.insert("activeTimers", {
      ...args,
      startTime: Date.now(),
    });
  },
});

export const stop = mutation({
  args: {
    userId: v.string(),
    workspaceId: v.id("workspaces"),
    billable: v.optional(v.boolean()),
    hourlyRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const timer = await ctx.db
      .query("activeTimers")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .unique();
    if (!timer) return null;

    const endTime = Date.now();
    const duration = Math.max(1, Math.round((endTime - timer.startTime) / 60000));

    await ctx.db.delete(timer._id);

    await ctx.db.insert("timeEntries", {
      workspaceId: args.workspaceId,
      userId: args.userId,
      projectId: timer.projectId,
      taskId: timer.taskId,
      description: timer.description,
      startTime: timer.startTime,
      endTime,
      duration,
      billable: args.billable ?? true,
      hourlyRate: args.hourlyRate,
    });

    return { duration };
  },
});

export const cancel = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const timer = await ctx.db
      .query("activeTimers")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .unique();
    if (timer) {
      await ctx.db.delete(timer._id);
    }
  },
});
