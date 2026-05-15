import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("invoices")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("invoices").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    clientId: v.id("clients"),
    invoiceNumber: v.string(),
    amount: v.number(),
    status: v.string(),
    date: v.string(),
    dueDate: v.string(),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      price: v.number(),
    })),
    tps: v.number(),
    tvq: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("invoices", args);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
