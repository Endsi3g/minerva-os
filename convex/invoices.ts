import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireWorkspaceMember } from "./auth";

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
    if (args.workspaceId) await requireWorkspaceMember(ctx, args.workspaceId);
    return await ctx.db.insert("invoices", args);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id);
    if (invoice?.workspaceId) await requireWorkspaceMember(ctx, invoice.workspaceId);
    await ctx.db.patch(args.id, { status: args.status });
    if (args.status === "sent" && invoice) {
      const client = await ctx.db.get(invoice.clientId);
      const workspace = invoice.workspaceId ? await ctx.db.get(invoice.workspaceId) : null;
      if (client?.email) {
        await ctx.scheduler.runAfter(0, internal.email.sendInvoice, {
          to: client.email,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          workspaceName: workspace?.name ?? "Minerva OS",
        });
      }
    }
  },
});

export const remove = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id);
    if (invoice?.workspaceId) await requireWorkspaceMember(ctx, invoice.workspaceId);
    await ctx.db.delete(args.id);
  },
});
