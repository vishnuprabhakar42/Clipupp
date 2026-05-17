import type { Metadata } from "next";
import { ProfileForm } from "@/features/auth/components/ProfileForm";
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Profile</h2>
        <ProfileForm />
      </section>
      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Change password</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Updating your password signs you out of every other device.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
