import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .withIndex("by_workspace", q => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();
  },
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    submittedBy: v.string(),
    amount: v.number(),
    currency: v.string(),
    category: v.string(),
    description: v.string(),
    date: v.number(),
    receiptStorageId: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expenses", { ...args, status: "pending" });
  },
});

export const approve = mutation({
  args: { id: v.id("expenses"), approvedBy: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "approved", approvedBy: args.approvedBy });
  },
});

export const reject = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "rejected" });
  },
});

export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
