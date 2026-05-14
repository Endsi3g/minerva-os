import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    targetId: v.string(),
    targetType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_target", (q) => 
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    targetId: v.string(),
    targetType: v.string(),
    author: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("comments", {
      ...args,
      timestamp: new Date().toISOString(),
    });
  },
});
