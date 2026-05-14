import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("finances").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    type: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.string(),
    description: v.string(),
    tps: v.number(),
    tvq: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("finances", args);
  },
});
