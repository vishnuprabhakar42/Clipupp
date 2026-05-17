import { apiClient } from "./client";
import type { CursorPage } from "./types";

export type ArticleSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  heroImageUrl: string | null;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  scheduledFor: string | null;
  authorId: string;
};

export type AuthorDetail = {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
};

export type ArticleDetail = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyMd: string;
  heroImageUrl: string | null;
  status: ArticleSummary["status"];
  publishedAt: string | null;
  scheduledFor: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  author: AuthorDetail | null;
};

export const blogApi = {
  list: (opts?: { cursor?: string; limit?: number }) => {
    const usp = new URLSearchParams();
    if (opts?.cursor) usp.append("cursor", opts.cursor);
    if (opts?.limit) usp.append("limit", String(opts.limit));
    const qs = usp.toString();
    return apiClient.get<CursorPage<ArticleSummary>>(
      `/api/v1/blog${qs ? `?${qs}` : ""}`,
      { anonymous: true }
    );
  },

  bySlug: (slug: string) =>
    apiClient.get<ArticleDetail>(`/api/v1/blog/${slug}`, { anonymous: true }),
};
