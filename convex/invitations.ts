import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireOwner } from "./auth";

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.union(v.literal("owner"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.workspaceId);
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await ctx.db.insert("invitations", {
      token,
      email: args.email,
      workspaceId: args.workspaceId,
      role: args.role,
      expiresAt,
    });
    const workspace = await ctx.db.get(args.workspaceId);
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.minervaos.app"}/invite/${token}`;
    await ctx.scheduler.runAfter(0, internal.email.sendInvitation, {
      to: args.email,
      workspaceName: workspace?.name ?? "Minerva OS",
      inviteUrl,
      role: args.role,
    });
    return token;
  },
});

export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be logged in to accept");
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!invitation) throw new Error("Invalid invitation");
    if (invitation.expiresAt < Date.now()) throw new Error("Invitation expired");
    if (invitation.acceptedAt) throw new Error("Invitation already accepted");
    const workspace = await ctx.db.get(invitation.workspaceId);
    if (!workspace) throw new Error("Workspace not found");
    const currentIds = workspace.memberIds ?? [];
    if (!currentIds.includes(identity.tokenIdentifier)) {
      await ctx.db.patch(invitation.workspaceId, {
        memberIds: [...currentIds, identity.tokenIdentifier],
      });
    }
    await ctx.db.patch(invitation._id, { acceptedAt: Date.now() });
    return invitation.workspaceId;
  },
});

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invitations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .take(100);
  },
});

export const revoke = mutation({
  args: {
    invitationId: v.id("invitations"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.workspaceId);
    await ctx.db.delete(args.invitationId);
  },
});
