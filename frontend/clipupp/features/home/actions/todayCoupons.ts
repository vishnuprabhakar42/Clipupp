"use server";

import { fetchTodayPage, type TodayPage, type TodayPageInput } from "../lib/todayPage";

/** One page of Today's list; see `fetchTodayPage`. Runs on the server so cards render as server components. */
export async function loadTodayCoupons(input: TodayPageInput): Promise<TodayPage> {
  return fetchTodayPage(input);
}
