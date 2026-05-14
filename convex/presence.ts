import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const update = mutation({
  args: {
    user: v.string(),
    status: v.string(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("presence")
      .filter((q) => q.eq(q.field("user"), args.user))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastActive: Date.now(),
        status: args.status,
        location: args.location,
      });
    } else {
      await ctx.db.insert("presence", {
        user: args.user,
        lastActive: Date.now(),
        status: args.status,
        location: args.location,
      });
    }
  },
});

export const list = query({
  args: {
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const threshold = Date.now() - 30000; // 30 seconds ago
    let q = ctx.db.query("presence").filter((q) => q.gt(q.field("lastActive"), threshold));
    
    if (args.location) {
      q = q.filter((q) => q.eq(q.field("location"), args.location));
    }
    
    return await q.collect();
  },
});
