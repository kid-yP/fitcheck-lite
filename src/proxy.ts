import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Pages that need a signed-in user. Everything else (landing, sign-in) is public.
const isPrivate = createRouteMatcher([
  "/wardrobe(.*)",
  "/add(.*)",
  "/outfits(.*)",
  "/stylist(.*)",
  "/api/stylist(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPrivate(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
