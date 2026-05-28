import { z } from "zod";

const passwordRules = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(200)
  .regex(/[a-z]/, "Must include a lowercase letter")
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/\d/, "Must include a digit");

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email").max(254),
  password: z.string().min(1, "Password is required"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().email("Enter a valid email").max(254),
  password: passwordRules,
});
export type SignupValues = z.infer<typeof signupSchema>;

export const forgotSchema = z.object({
  email: z.string().email("Enter a valid email").max(254),
});
export type ForgotValues = z.infer<typeof forgotSchema>;

export const resetSchema = z
  .object({
    newPassword: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type ResetValues = z.infer<typeof resetSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const profileSchema = z.object({
  name: z.string().trim().max(120).optional(),
  imageUrl: z
    .string()
    .url("Must be a URL")
    .max(500)
    .optional()
    .or(z.literal("")),
  locale: z
    .enum(["en", "hi"], { message: "Choose a supported language" })
    .optional(),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const preferencesSchema = z.object({
  preferredCurrency: z.string().regex(/^[A-Z]{3}$/, "ISO 4217 (e.g. INR)").optional(),
  emailOptIn: z.boolean().optional(),
  weeklyDigestOptIn: z.boolean().optional(),
  marketingOptIn: z.boolean().optional(),
});
export type PreferencesValues = z.infer<typeof preferencesSchema>;
