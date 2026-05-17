import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMember } from "./auth";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    clientName: v.string(),
    status: v.string(),
    dueDate: v.string(),
    budget: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    return await ctx.db.insert("projects", args);
  },
});

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    status: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    budget: v.optional(v.number()),
    embedding: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (project?.workspaceId) await requireWorkspaceMember(ctx, project.workspaceId);
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const getProjectDashboard = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    const approvals = await ctx.db
      .query("approvals")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    return {
      project,
      tasks,
      approvals,
      milestones,
    };
  },
});

export const updateProjectHealth = mutation({
  args: {
    projectId: v.id("projects"),
    healthScore: v.number(),
    riskFlags: v.array(v.string()),
  },
  handler: async (ctx, { projectId, healthScore, riskFlags }) => {
    await ctx.db.patch(projectId, {
      healthScore,
      activeRiskFlags: riskFlags,
    });
    
    // Log activity
    const project = await ctx.db.get(projectId);
    if (project) {
      await ctx.db.insert("activity", {
        workspaceId: project.workspaceId,
        user: "Agent",
        action: "updated_health",
        targetName: project.name,
        timestamp: new Date().toISOString(),
        type: "project",
      });
    }
  },
});
