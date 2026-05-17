import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("email"), args.email))
      .unique();
  },
});

export const update = mutation({
  args: {
    id: v.id("userProfiles"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const add = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userProfiles", args);
  },
});
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});

export const markChecklistItem = mutation({
  args: { email: v.string(), itemId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (!profile) return;
    const existing = profile.completedChecklist ?? [];
    if (!existing.includes(args.itemId)) {
      await ctx.db.patch(profile._id, { completedChecklist: [...existing, args.itemId] });
    }
  },
});

export const markOnboardingDone = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (profile) {
      await ctx.db.patch(profile._id, { onboardingCompleted: true });
    }
  },
});

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Convex Auth stores users in the "users" table
    // We can join with our "userProfiles" or just use the "users" table
    // For now, let's look up in userProfiles by email
    const profile = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .unique();

    if (profile) return profile;

    // If no profile, return a synthesized one from identity
    return {
      _id: identity.subject as any,
      email: identity.email!,
      name: identity.name!,
      role: "project_manager", // Default role
    };
  },
});
