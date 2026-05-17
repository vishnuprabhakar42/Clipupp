"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { isApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";

type Status = "verifying" | "success" | "expired" | "invalid" | "error";

export function VerifyEmailRunner() {
  const search = useSearchParams();
  const token = search.get("token") ?? "";
  const [status, setStatus] = useState<Status>(token ? "verifying" : "invalid");
  const ranOnce = useRef(false);

  useEffect(() => {
    if (!token || ranOnce.current) return;
    ranOnce.current = true;
    (async () => {
      try {
        await authApi.verifyEmail(token);
        setStatus("success");
      } catch (err) {
        if (isApiError(err)) {
          if (err.code === "TOKEN_EXPIRED") setStatus("expired");
          else if (err.code === "TOKEN_INVALID") setStatus("invalid");
          else setStatus("error");
        } else {
          setStatus("error");
        }
      }
    })();
  }, [token]);

  if (status === "verifying") {
    return <p className="text-sm text-muted-foreground">Verifying your email…</p>;
  }
  if (status === "success") {
    return (
      <div className="space-y-3 text-center">
        <h2 className="text-lg font-semibold">Email verified</h2>
        <p className="text-sm text-muted-foreground">
          You&apos;re all set. You can now sign in.
        </p>
        <Button asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    );
  }
  if (status === "expired" || status === "invalid") {
    return (
      <div className="space-y-3 text-center">
        <h2 className="text-lg font-semibold">
          {status === "expired" ? "Link expired" : "Link is invalid"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Verification links are valid for 24 hours. Request a new one.
        </p>
        <Button asChild>
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-3 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t reach the server. Please try again.
      </p>
    </div>
  );
}
