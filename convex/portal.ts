import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const portalToken = await ctx.db
      .query("portalTokens")
      .filter((q) => q.eq(q.field("token"), args.token))
      .first();

    if (!portalToken) return null;

    const client = await ctx.db.get(portalToken.clientId);
    if (!client) return null;

    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("clientName"), client.company))
      .collect();

    const projectIds = projects.map(p => p._id);

    const approvals = await ctx.db
      .query("approvals")
      .collect();
    
    // Filter approvals for this client's projects
    const clientApprovals = approvals.filter(a => projectIds.includes(a.projectId));

    const invoices = await ctx.db
      .query("invoices")
      .filter((q) => q.eq(q.field("clientId"), client._id))
      .collect();

    const milestones = await ctx.db
      .query("milestones")
      .collect();
    
    const clientMilestones = milestones.filter(m => projectIds.includes(m.projectId));

    const tasks = await ctx.db
      .query("tasks")
      .collect();
    
    const clientTasks = tasks.filter(t => t.projectId !== undefined && projectIds.includes(t.projectId));

    const assets = await ctx.db
      .query("assets")
      .filter((q) => q.eq(q.field("clientId"), client._id))
      .collect();

    return {
      token: portalToken,
      client,
      projects,
      tasks: clientTasks,
      approvals: clientApprovals,
      invoices,
      milestones: clientMilestones,
      assets,
    };
  },
});
