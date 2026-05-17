import { apiClient } from "./client";

export type BannerPlacement = "HERO_CAROUSEL" | "TOP_BAR" | "PROMO_CARD";

export type BannerDetail = {
  id: string;
  position: number;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  countryCode: string | null;
  placement: BannerPlacement;
};

export const bannersApi = {
  list: (opts?: { country?: string; placement?: BannerPlacement }) => {
    const usp = new URLSearchParams();
    if (opts?.country) usp.append("country", opts.country);
    if (opts?.placement) usp.append("placement", opts.placement);
    const qs = usp.toString();
    return apiClient.get<BannerDetail[]>(
      `/api/v1/banners${qs ? `?${qs}` : ""}`,
      { anonymous: true }
    );
  },
};
