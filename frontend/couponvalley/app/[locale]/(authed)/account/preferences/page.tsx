import type { Metadata } from "next";
import { PreferencesForm } from "@/features/auth/components/PreferencesForm";

export const metadata: Metadata = {
  title: "Preferences",
  robots: { index: false, follow: false },
};

export default function PreferencesPage() {
  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold">Preferences</h2>
      <PreferencesForm />
    </section>
  );
}
