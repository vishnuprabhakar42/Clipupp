"use client";

import { GoogleOAuthProvider as Provider } from "@react-oauth/google";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function GoogleOAuthProvider({ children }: { children: React.ReactNode }) {
  if (!clientId) {
    // Google OAuth not configured — render children without the provider.
    // The GoogleSignInButton will be hidden in sign-in/sign-up forms when clientId is absent.
    return <>{children}</>;
  }
  return <Provider clientId={clientId}>{children}</Provider>;
}
