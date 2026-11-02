// Tells Convex to trust sign-in tokens issued by your Clerk app.
// CLERK_JWT_ISSUER_DOMAIN is set in the Convex dashboard (see README).
const authConfig = {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
