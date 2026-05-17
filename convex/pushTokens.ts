import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const register = mutation({
  args: {
    userId: v.string(),
    workspaceId: v.id("workspaces"),
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("token"), args.token))
      .first();

    if (!existing) {
      await ctx.db.insert("pushTokens", {
        userId: args.userId,
        workspaceId: args.workspaceId,
        token: args.token,
        platform: args.platform,
        registeredAt: Date.now(),
      });
    }
  },
});

export const remove = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("pushTokens")
      .filter((q) => q.eq(q.field("token"), args.token))
      .first();
    if (doc) await ctx.db.delete(doc._id);
  },
});

export const listByWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("pushTokens")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});
