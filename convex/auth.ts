import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});

export async function requireWorkspaceMember(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">
): Promise<{ userId: string; role: string }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) throw new Error("Workspace not found");
  const memberIds = workspace.memberIds ?? [];
  if (memberIds.length > 0 && !memberIds.includes(identity.tokenIdentifier)) {
    throw new Error("Not a workspace member");
  }
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user_id", (q) => q.eq("userId", identity.tokenIdentifier))
    .first();
  return { userId: identity.tokenIdentifier, role: profile?.role ?? "member" };
}

export async function requireOwner(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">
): Promise<string> {
  const { userId, role } = await requireWorkspaceMember(ctx, workspaceId);
  if (role !== "owner") throw new Error("Owner required");
  return userId;
}
