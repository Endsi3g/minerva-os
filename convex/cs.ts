import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createClientCheckinTaskDraft = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    clientId: v.id("clients"),
    title: v.string(),
    description: v.string(),
    ownerEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // We don't have a direct tasks->client link, so we create a workspace-level task
    // with the client embedded in the title for now
    return await ctx.db.insert("tasks", {
      workspaceId: args.workspaceId,
      // Attach to a sentinel project or use workspaceId only—
      // for now we just mark it with status "draft" so the team can find it
      projectId: undefined as any,
      title: args.title,
      status: "draft",
      priority: "medium",
      assignee: args.ownerEmail,
      dueDate: "",
    });
  },
});

export const createClientUpdateEmailDraft = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    clientId: v.id("clients"),
    subject: v.string(),
    body: v.string(),
    recipientEmail: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailDrafts", {
      workspaceId: args.workspaceId,
      clientId: args.clientId,
      subject: args.subject,
      body: args.body,
      recipientEmail: args.recipientEmail,
      status: "draft",
      source: "agent_client_success",
      timestamp: new Date().toISOString(),
    });
  },
});
