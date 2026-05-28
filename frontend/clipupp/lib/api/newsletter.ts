import { apiClient } from "./client";

export type NewsletterStatus = "PENDING" | "CONFIRMED" | "UNSUBSCRIBED";

export type SubscribeResponse = {
  state: NewsletterStatus;
  confirmEmailSent: boolean;
};

export type StateResponse = {
  state: NewsletterStatus;
  email: string;
};

export const newsletterApi = {
  subscribe: (email: string, locale?: string) =>
    apiClient.post<SubscribeResponse>(
      "/api/v1/newsletter/subscribe",
      { email, locale },
      { anonymous: true }
    ),

  confirm: (token: string) =>
    apiClient.get<StateResponse>(
      `/api/v1/newsletter/confirm?token=${encodeURIComponent(token)}`,
      { anonymous: true }
    ),

  unsubscribe: (token: string) =>
    apiClient.get<StateResponse>(
      `/api/v1/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
      { anonymous: true }
    ),
};
