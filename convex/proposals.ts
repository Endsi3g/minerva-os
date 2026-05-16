import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("proposals")
      .withIndex("by_workspace", q => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();
  },
});

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("proposals")
      .withIndex("by_token", q => q.eq("token", args.token))
      .unique();
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    clientId: v.optional(v.id("clients")),
    dealId: v.optional(v.id("deals")),
    sections: v.array(v.object({ type: v.string(), content: v.string() })),
    serviceIds: v.array(v.string()),
    totalAmount: v.number(),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("proposals", {
      ...args,
      status: "draft",
      token: generateToken(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("proposals"),
    title: v.optional(v.string()),
    sections: v.optional(v.array(v.object({ type: v.string(), content: v.string() }))),
    serviceIds: v.optional(v.array(v.string())),
    totalAmount: v.optional(v.number()),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const send = mutation({
  args: { id: v.id("proposals") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "sent", sentAt: Date.now() });
  },
});

export const sign = mutation({
  args: { token: v.string(), signedBy: v.string() },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query("proposals")
      .withIndex("by_token", q => q.eq("token", args.token))
      .unique();
    if (!proposal) throw new Error("Proposal not found");
    await ctx.db.patch(proposal._id, {
      status: "signed",
      signedAt: Date.now(),
      signedBy: args.signedBy,
    });
    return proposal._id;
  },
});

export const decline = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query("proposals")
      .withIndex("by_token", q => q.eq("token", args.token))
      .unique();
    if (!proposal) throw new Error("Proposal not found");
    await ctx.db.patch(proposal._id, { status: "declined" });
  },
});

export const remove = mutation({
  args: { id: v.id("proposals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
