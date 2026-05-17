import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMember } from "./auth";

export const get = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    projectId: v.id("projects"),
    status: v.string(),
    priority: v.string(),
    assignee: v.string(),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const taskId = await ctx.db.insert("tasks", {
      workspaceId: args.workspaceId,
      title: args.title,
      projectId: args.projectId,
      status: args.status,
      priority: args.priority,
      assignee: args.assignee,
      dueDate: args.dueDate,
    });
    
    await ctx.db.insert("activity", {
      workspaceId: args.workspaceId,
      user: args.assignee, // Simple mapping for now
      action: "created task",
      targetName: args.title,
      type: "task",
      timestamp: new Date().toISOString(),
    });

    return taskId;
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignee: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const old = await ctx.db.get(id);
    if (old?.workspaceId) await requireWorkspaceMember(ctx, old.workspaceId);
    await ctx.db.patch(id, fields);

    if (fields.status && old?.status !== fields.status) {
      await ctx.db.insert("activity", {
        workspaceId: old?.workspaceId as any,
        user: "Studio", // placeholder
        action: `updated status to ${fields.status}`,
        targetName: old?.title ?? "Task",
        type: "task",
        timestamp: new Date().toISOString(),
      });
    }
  },
});

export const listProjectTasks = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
  },
});

export const createTaskDraft = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    suggestedAssignee: v.optional(v.string()),
    suggestedDueDate: v.optional(v.string()),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    return await ctx.db.insert("tasks", {
      workspaceId: args.workspaceId,
      projectId: args.projectId,
      title: args.title,
      status: "draft",
      priority: "medium",
      assignee: args.suggestedAssignee ?? "unassigned",
      dueDate: args.suggestedDueDate ?? "",
    });
  },
});
