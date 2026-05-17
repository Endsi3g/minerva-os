import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memberAvailability")
      .withIndex("by_workspace", q => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const upsertMember = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.string(),
    displayName: v.string(),
    weeklyHours: v.number(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("memberAvailability")
      .withIndex("by_workspace", q => q.eq("workspaceId", args.workspaceId))
      .filter(q => q.eq(q.field("userId"), args.userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        weeklyHours: args.weeklyHours,
        role: args.role,
      });
      return existing._id;
    }
    return await ctx.db.insert("memberAvailability", args);
  },
});

export const removeMember = mutation({
  args: { id: v.id("memberAvailability") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
