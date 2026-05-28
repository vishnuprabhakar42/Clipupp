"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminApi, type AdminUserRow, type Role } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/errors";

const ROLES: Role[] = ["USER", "ADMIN", "SUPER_ADMIN"];

export function UserRoleControls({ user }: { user: AdminUserRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(role: Role) {
    setBusy(role);
    try {
      if (user.roles.includes(role)) {
        await adminApi.revokeRole(user.id, role);
        toast.success(`Revoked ${role}`);
      } else {
        await adminApi.grantRole(user.id, role);
        toast.success(`Granted ${role}`);
      }
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Could not update role");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      {ROLES.map((role) => {
        const has = user.roles.includes(role);
        return (
          <Button
            key={role}
            type="button"
            size="sm"
            variant={has ? "default" : "outline"}
            disabled={busy !== null}
            onClick={() => toggle(role)}
            className="h-7 text-[10px]"
          >
            {busy === role ? "…" : has ? `−${role}` : `+${role}`}
          </Button>
        );
      })}
    </div>
  );
}
