import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createRiskMitigationPlan = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    riskFlagId: v.id("riskFlags"),
    planText: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiSummaries", {
      workspaceId: args.workspaceId,
      projectId: args.projectId,
      riskFlagId: args.riskFlagId,
      clientId: undefined,
      type: "mitigation_plan",
      content: args.planText,
      timestamp: new Date().toISOString(),
    });
  },
});

export const createClientHealthReportDraft = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    clientId: v.id("clients"),
    period: v.string(),
    reportText: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiSummaries", {
      workspaceId: args.workspaceId,
      clientId: args.clientId,
      projectId: undefined,
      riskFlagId: undefined,
      type: "health_report",
      content: `Period: ${args.period}\n\n${args.reportText}`,
      timestamp: new Date().toISOString(),
    });
  },
});

export const listProjectSummaries = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("aiSummaries")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
  },
});
