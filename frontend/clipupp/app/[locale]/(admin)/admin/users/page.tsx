import type { Metadata } from "next";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { AdminUserRow, SpringPage } from "@/lib/api/admin";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { UserRoleControls } from "@/features/admin/components/UserRoleControls";

export const metadata: Metadata = {
  title: "Admin · Users",
  robots: { index: false },
};

type SearchParams = Promise<{ page?: string }>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "0") || 0;
  const data = await adminFetch<SpringPage<AdminUserRow>>(
    `/api/v1/admin/users?page=${page}&size=50`
  );
  const users = data?.content ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Account list with role grants and status overrides. Audit logged."
      />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Verified</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Roles</th>
              <th className="px-4 py-2">Last login</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 font-medium">{u.email}</td>
                <td className="px-4 py-2">{u.emailVerified ? "Yes" : "No"}</td>
                <td className="px-4 py-2">{u.status}</td>
                <td className="px-4 py-2 font-mono text-xs">{u.roles.join(", ")}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <UserRoleControls user={u} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
