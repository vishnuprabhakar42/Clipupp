"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usersApi } from "@/lib/api/users";
import { isApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/AuthProvider";
import { profileSchema, type ProfileValues } from "@/features/auth/schemas";

export function ProfileForm() {
  const auth = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: auth.user?.name ?? "",
      imageUrl: auth.user?.imageUrl ?? "",
      locale: (auth.user?.locale as ProfileValues["locale"]) ?? "en",
    },
  });

  async function onSubmit(values: ProfileValues) {
    setSubmitting(true);
    try {
      const next = await usersApi.updateProfile({
        name: values.name?.trim() || undefined,
        imageUrl: values.imageUrl ? values.imageUrl : undefined,
        locale: values.locale,
      });
      auth.setUser(next);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Could not save changes");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Display name</Label>
        <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="imageUrl">Avatar URL</Label>
        <Input
          id="imageUrl"
          type="url"
          placeholder="https://…"
          {...register("imageUrl")}
          aria-invalid={!!errors.imageUrl}
        />
        {errors.imageUrl && (
          <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="locale">Language</Label>
        <select
          id="locale"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          {...register("locale")}
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी (Hindi)</option>
        </select>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
