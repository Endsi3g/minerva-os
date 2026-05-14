import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("retainers").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    clientId: v.id("clients"),
    amount: v.number(),
    cycle: v.string(),
    status: v.string(),
    startDate: v.string(),
    renewalDate: v.string(),
    hoursIncluded: v.number(),
    hoursUsed: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("retainers", args);
  },
});
