"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useState, type ReactNode } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const [client] = useState(() => (url ? new ConvexReactClient(url) : null));

  if (!client) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <h1 className="display text-3xl">Almost there</h1>
        <p className="mt-3">
          <code>NEXT_PUBLIC_CONVEX_URL</code> is missing. Run <code>npx convex dev</code> in a
          second terminal (it writes the value into <code>.env.local</code>), then restart{" "}
          <code>npm run dev</code>.
        </p>
      </div>
    );
  }
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
