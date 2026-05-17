import { apiClient } from "./client";
import { tokenStore } from "@/lib/auth/token-store";
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  UserSummary,
} from "./types";

export const authApi = {
  async register(input: RegisterInput): Promise<UserSummary> {
    return apiClient.post<UserSummary>("/api/v1/auth/register", input, {
      anonymous: true,
    });
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>(
      "/api/v1/auth/login",
      input,
      { anonymous: true }
    );
    tokenStore.set(res.accessToken);
    return res;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post<void>("/api/v1/auth/logout");
    } finally {
      tokenStore.clear();
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post<void>(
      "/api/v1/auth/forgot-password",
      { email },
      { anonymous: true }
    );
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post<void>(
      "/api/v1/auth/reset-password",
      { token, newPassword },
      { anonymous: true }
    );
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post<void>(
      "/api/v1/auth/verify-email",
      { token },
      { anonymous: true }
    );
  },

  async resendVerification(email: string): Promise<void> {
    await apiClient.post<void>(
      "/api/v1/auth/resend-verification",
      { email },
      { anonymous: true }
    );
  },

  async googleOAuth(idToken: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>(
      "/api/v1/auth/oauth2/google",
      { idToken },
      { anonymous: true }
    );
    tokenStore.set(res.accessToken);
    return res;
  },
};
