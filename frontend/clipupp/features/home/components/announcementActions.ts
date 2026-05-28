"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ANNOUNCEMENT_COOKIE } from "./announcementConstants";

export async function dismissAnnouncement(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const jar = await cookies();
  jar.set({
    name: ANNOUNCEMENT_COOKIE,
    value: id,
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 days — long enough that a "dismissed" bar
                                // stays dismissed across visits, short enough
                                // that admins re-announcing the same id
                                // eventually re-appears for returning users.
  });
  revalidatePath("/");
}
