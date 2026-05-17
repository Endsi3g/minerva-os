import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMember } from "./auth";

export const list = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    targetUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      read: false,
      timestamp: new Date().toISOString(),
    });
  },
});

export const markAsRead = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { read: true });
  },
});
export const cleanupOld = mutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString();

    const oldNotifications = await ctx.db
      .query("notifications")
      .filter((q: any) => q.lt(q.field("timestamp"), dateStr))
      .collect();

    for (const notification of oldNotifications) {
      await ctx.db.delete(notification._id);
    }
  },
});

export const notifyPMAboutRisk = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    pmId: v.string(),
    riskFlagId: v.id("riskFlags"),
    summary: v.string(),
    suggestedActions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const project = await ctx.db.get(args.projectId);
    const actionsText = args.suggestedActions.slice(0, 3).join(" · ");
    return await ctx.db.insert("notifications", {
      workspaceId: args.workspaceId,
      userId: args.pmId,
      title: `Risk Detected: ${project?.name ?? "Project"}`,
      message: `${args.summary}\n\nSuggested actions: ${actionsText}`,
      type: "agent_risk_alert",
      read: false,
      targetUrl: `/app/projects/${args.projectId}`,
      timestamp: new Date().toISOString(),
    });
  },
});

export const notifyOwnerAboutStalledRisk = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    pmId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const project = await ctx.db.get(args.projectId);
    return await ctx.db.insert("notifications", {
      workspaceId: args.workspaceId,
      userId: args.pmId,
      title: `Unresolved Risk: ${project?.name ?? "Project"}`,
      message: "No improvement detected after 3 days. This project risk requires immediate attention.",
      type: "agent_risk_escalation",
      read: false,
      targetUrl: `/app/projects/${args.projectId}`,
      timestamp: new Date().toISOString(),
    });
  },
});
