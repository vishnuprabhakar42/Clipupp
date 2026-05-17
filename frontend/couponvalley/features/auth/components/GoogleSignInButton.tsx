"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useRouter } from "@/lib/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthProvider";

interface Props {
  label?: string;
}

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleSignInButton({ label = "Continue with Google" }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/account";
  const auth = useAuth();
  const [loading, setLoading] = useState(false);

  if (!clientId) return null;

  return (
    <>
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>
      <div className={loading ? "pointer-events-none opacity-60" : undefined}>
      <GoogleLogin
        text="continue_with"
        shape="rectangular"
        width="100%"
        onSuccess={async (credentialResponse) => {
          const idToken = credentialResponse.credential;
          if (!idToken) {
            toast.error("Google did not return a credential. Try again.");
            return;
          }
          setLoading(true);
          try {
            const res = await authApi.googleOAuth(idToken);
            auth.setUser(res.user);
            toast.success("Signed in with Google");
            router.push(next);
            router.refresh();
          } catch {
            toast.error("Google sign-in failed. Please try again.");
          } finally {
            setLoading(false);
          }
        }}
        onError={() => toast.error("Google sign-in failed. Please try again.")}
        useOneTap={false}
      />
      </div>
    </>
  );
}
