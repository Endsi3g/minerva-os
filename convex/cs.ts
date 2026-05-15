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
    return await ctx.db.insert("tasks", {
      workspaceId: args.workspaceId,
      title: args.title,
      status: "todo",
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
