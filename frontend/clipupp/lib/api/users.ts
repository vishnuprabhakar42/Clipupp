import { apiClient } from "./client";
import type {
  ChangePasswordInput,
  Preference,
  UpdatePreferencesInput,
  UpdateProfileInput,
  UserSummary,
} from "./types";

export const usersApi = {
  me: (cookie?: string) =>
    apiClient.get<UserSummary>("/api/v1/users/me", { cookie }),

  updateProfile: (input: UpdateProfileInput) =>
    apiClient.patch<UserSummary>("/api/v1/users/me", input),

  changePassword: (input: ChangePasswordInput) =>
    apiClient.patch<void>("/api/v1/users/me/password", input),

  preferences: () => apiClient.get<Preference>("/api/v1/users/me/preferences"),

  updatePreferences: (input: UpdatePreferencesInput) =>
    apiClient.patch<Preference>("/api/v1/users/me/preferences", input),
};
