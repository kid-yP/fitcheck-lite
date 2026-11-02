// Small helper shared by all backend functions.
export async function requireUserId(ctx: {
  auth: { getUserIdentity(): Promise<{ subject: string } | null> };
}): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not signed in");
  return identity.subject;
}
