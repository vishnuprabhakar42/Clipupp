import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // CouponValley Crimson + Amber palette — Phase 2 redesign.
        // All hex source values live in app/globals.css as CSS vars. The
        // RGB triplets (--cv-*-rgb) here let Tailwind's slash-opacity
        // modifier work: `text-cv-primary/40`, `ring-cv-accent/30`, etc.
        "cv-primary": {
          DEFAULT: "rgb(var(--cv-primary-rgb) / <alpha-value>)",
          strong:  "rgb(var(--cv-primary-strong-rgb) / <alpha-value>)",
          soft:    "rgb(var(--cv-primary-soft-rgb) / <alpha-value>)",
          fg:      "rgb(var(--cv-primary-fg-rgb) / <alpha-value>)",
          // Full numeric scale for fine-grained use (e.g. text-cv-primary-700).
          50:  "#FFF1F1",
          100: "#FFE0E0",
          200: "#FFC5C5",
          300: "#FF9B9B",
          400: "#FF6B6B",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
        },
        "cv-accent": {
          DEFAULT: "rgb(var(--cv-accent-rgb) / <alpha-value>)",
          strong:  "rgb(var(--cv-accent-strong-rgb) / <alpha-value>)",
          soft:    "rgb(var(--cv-accent-soft-rgb) / <alpha-value>)",
          fg:      "rgb(var(--cv-accent-fg-rgb) / <alpha-value>)",
          50:  "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        "cv-success": {
          DEFAULT: "rgb(var(--cv-success-rgb) / <alpha-value>)",
          strong:  "rgb(var(--cv-success-strong-rgb) / <alpha-value>)",
          soft:    "rgb(var(--cv-success-soft-rgb) / <alpha-value>)",
          fg:      "rgb(var(--cv-success-fg-rgb) / <alpha-value>)",
        },
        "cv-danger": {
          DEFAULT: "rgb(var(--cv-danger-rgb) / <alpha-value>)",
          strong:  "rgb(var(--cv-danger-strong-rgb) / <alpha-value>)",
          soft:    "rgb(var(--cv-danger-soft-rgb) / <alpha-value>)",
          fg:      "rgb(var(--cv-danger-fg-rgb) / <alpha-value>)",
        },
        "cv-neutral": {
          50:  "rgb(var(--cv-neutral-50-rgb) / <alpha-value>)",
          100: "rgb(var(--cv-neutral-100-rgb) / <alpha-value>)",
          200: "rgb(var(--cv-neutral-200-rgb) / <alpha-value>)",
          300: "rgb(var(--cv-neutral-300-rgb) / <alpha-value>)",
          400: "rgb(var(--cv-neutral-400-rgb) / <alpha-value>)",
          500: "rgb(var(--cv-neutral-500-rgb) / <alpha-value>)",
          600: "rgb(var(--cv-neutral-600-rgb) / <alpha-value>)",
          700: "rgb(var(--cv-neutral-700-rgb) / <alpha-value>)",
          800: "rgb(var(--cv-neutral-800-rgb) / <alpha-value>)",
          900: "rgb(var(--cv-neutral-900-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        // Inter (body) + Manrope (display) injected as CSS vars by next/font
        // in app/[locale]/layout.tsx. The `var(--font-sans)` resolves to the
        // Next-generated `--font-inter`, `var(--font-display)` to
        // `--font-manrope`. Fallback stack present in globals.css.
        sans: [
          "var(--font-sans)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Helvetica Neue",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "Manrope",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Helvetica Neue",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      // Radius scale by component type. Tags 6, buttons/inputs 8, cards 12,
      // modals 16, pills full. Never mix radii within a component.
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        full: "9999px",
      },
      boxShadow: {
        // Semantic shadow tiers — every elevation maps to one of these.
        // See app/globals.css `--cv-shadow-*` for the source.
        resting:        "var(--cv-shadow-resting)",
        hover:          "var(--cv-shadow-hover)",
        lifted:         "var(--cv-shadow-lifted)",
        modal:          "var(--cv-shadow-modal)",
        "glow-primary": "var(--cv-shadow-glow-primary)",
        "glow-accent":  "var(--cv-shadow-glow-accent)",
        "glow-success": "var(--cv-shadow-glow-success)",
        // Legacy aliases kept for back-compat during sweep.
        card:        "var(--cv-shadow-resting)",
        "card-hover": "var(--cv-shadow-hover)",
      },
      transitionTimingFunction: {
        "cv-out":    "cubic-bezier(0.16, 1, 0.3, 1)",
        "cv-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        "cv-fast": "120ms",
        "cv-base": "200ms",
        "cv-slow": "320ms",
      },
      zIndex: {
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        "modal-backdrop": "var(--z-modal-backdrop)",
        modal: "var(--z-modal)",
        toast: "var(--z-toast)",
      },
      maxWidth: {
        container: "1280px",
        prose: "680px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          "0%":   { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%":   { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0%)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 0%" },
          "50%":      { backgroundPosition: "100% 50%" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 0 rgb(var(--cv-accent-rgb) / 0.40), 0 8px 24px -6px rgb(var(--cv-accent-rgb) / 0.40)",
          },
          "50%": {
            boxShadow:
              "0 0 0 8px rgb(var(--cv-accent-rgb) / 0), 0 8px 24px -6px rgb(var(--cv-accent-rgb) / 0.55)",
          },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)",   opacity: "1" },
          "50%":      { transform: "scale(1.4)", opacity: "0.6" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "marquee-scroll":                "marquee 40s linear infinite",
        "marquee-scroll-reverse":        "marquee-reverse 40s linear infinite",
        "marquee-scroll-slow":           "marquee 60s linear infinite",
        "marquee-scroll-reverse-slow":   "marquee-reverse 60s linear infinite",
        "gradient-shift": "gradient-shift 18s linear infinite",
        "pulse-glow":     "pulse-glow 2.4s ease-in-out infinite",
        "pulse-dot":      "pulse-dot 1.4s ease-in-out infinite",
        "fade-in-up":     "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
