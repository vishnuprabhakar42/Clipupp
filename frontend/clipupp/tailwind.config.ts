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
        // Clipupp Crimson + Amber palette — Phase 2 redesign.
        // All hex source values live in app/globals.css as CSS vars. The
        // RGB triplets (--clipupp-*-rgb) here let Tailwind's slash-opacity
        // modifier work: `text-clipupp-primary/40`, `ring-clipupp-accent/30`, etc.
        "clipupp-primary": {
          DEFAULT: "rgb(var(--clipupp-primary-rgb) / <alpha-value>)",
          strong:  "rgb(var(--clipupp-primary-strong-rgb) / <alpha-value>)",
          soft:    "rgb(var(--clipupp-primary-soft-rgb) / <alpha-value>)",
          fg:      "rgb(var(--clipupp-primary-fg-rgb) / <alpha-value>)",
          // Full numeric scale for fine-grained use (e.g. text-clipupp-primary-700).
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
        "clipupp-accent": {
          DEFAULT: "rgb(var(--clipupp-accent-rgb) / <alpha-value>)",
          strong:  "rgb(var(--clipupp-accent-strong-rgb) / <alpha-value>)",
          soft:    "rgb(var(--clipupp-accent-soft-rgb) / <alpha-value>)",
          fg:      "rgb(var(--clipupp-accent-fg-rgb) / <alpha-value>)",
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
        "clipupp-success": {
          DEFAULT: "rgb(var(--clipupp-success-rgb) / <alpha-value>)",
          strong:  "rgb(var(--clipupp-success-strong-rgb) / <alpha-value>)",
          soft:    "rgb(var(--clipupp-success-soft-rgb) / <alpha-value>)",
          fg:      "rgb(var(--clipupp-success-fg-rgb) / <alpha-value>)",
        },
        "clipupp-danger": {
          DEFAULT: "rgb(var(--clipupp-danger-rgb) / <alpha-value>)",
          strong:  "rgb(var(--clipupp-danger-strong-rgb) / <alpha-value>)",
          soft:    "rgb(var(--clipupp-danger-soft-rgb) / <alpha-value>)",
          fg:      "rgb(var(--clipupp-danger-fg-rgb) / <alpha-value>)",
        },
        "clipupp-neutral": {
          50:  "rgb(var(--clipupp-neutral-50-rgb) / <alpha-value>)",
          100: "rgb(var(--clipupp-neutral-100-rgb) / <alpha-value>)",
          200: "rgb(var(--clipupp-neutral-200-rgb) / <alpha-value>)",
          300: "rgb(var(--clipupp-neutral-300-rgb) / <alpha-value>)",
          400: "rgb(var(--clipupp-neutral-400-rgb) / <alpha-value>)",
          500: "rgb(var(--clipupp-neutral-500-rgb) / <alpha-value>)",
          600: "rgb(var(--clipupp-neutral-600-rgb) / <alpha-value>)",
          700: "rgb(var(--clipupp-neutral-700-rgb) / <alpha-value>)",
          800: "rgb(var(--clipupp-neutral-800-rgb) / <alpha-value>)",
          900: "rgb(var(--clipupp-neutral-900-rgb) / <alpha-value>)",
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
        // See app/globals.css `--clipupp-shadow-*` for the source.
        resting:        "var(--clipupp-shadow-resting)",
        hover:          "var(--clipupp-shadow-hover)",
        lifted:         "var(--clipupp-shadow-lifted)",
        modal:          "var(--clipupp-shadow-modal)",
        "glow-primary": "var(--clipupp-shadow-glow-primary)",
        "glow-accent":  "var(--clipupp-shadow-glow-accent)",
        "glow-success": "var(--clipupp-shadow-glow-success)",
        // Legacy aliases kept for back-compat during sweep.
        card:        "var(--clipupp-shadow-resting)",
        "card-hover": "var(--clipupp-shadow-hover)",
      },
      transitionTimingFunction: {
        "clipupp-out":    "cubic-bezier(0.16, 1, 0.3, 1)",
        "clipupp-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        "clipupp-fast": "120ms",
        "clipupp-base": "200ms",
        "clipupp-slow": "320ms",
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
              "0 0 0 0 rgb(var(--clipupp-accent-rgb) / 0.40), 0 8px 24px -6px rgb(var(--clipupp-accent-rgb) / 0.40)",
          },
          "50%": {
            boxShadow:
              "0 0 0 8px rgb(var(--clipupp-accent-rgb) / 0), 0 8px 24px -6px rgb(var(--clipupp-accent-rgb) / 0.55)",
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
