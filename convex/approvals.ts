import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("approvals").order("desc").collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("approvals"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const old = await ctx.db.get(id);
    await ctx.db.patch(id, fields);

    if (fields.status && old?.status !== fields.status) {
      await ctx.db.insert("activity", {
        user: "System",
        action: `marked ${old?.name} as ${fields.status}`,
        targetName: old?.name ?? "Deliverable",
        type: "approval",
        timestamp: new Date().toISOString(),
      });
    }
  },
});
