import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("invoices")
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .collect();
    }
    return await ctx.db.query("invoices").collect();
  },
});

export const create = mutation({
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
