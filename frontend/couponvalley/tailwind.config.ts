import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
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
        // CouponValley 5-color brand palette — every brand-coloured surface
        // across the site reaches for one of these. Defined as raw-hex CSS
        // vars in app/globals.css so OG-image edge routes can mirror them.
        "cv-primary": {
          DEFAULT: "var(--cv-primary)",
          strong:  "var(--cv-primary-strong)",
          soft:    "var(--cv-primary-soft)",
          fg:      "var(--cv-primary-fg)",
        },
        "cv-accent": {
          DEFAULT: "var(--cv-accent)",
          strong:  "var(--cv-accent-strong)",
          soft:    "var(--cv-accent-soft)",
          fg:      "var(--cv-accent-fg)",
        },
        "cv-success": {
          DEFAULT: "var(--cv-success)",
          strong:  "var(--cv-success-strong)",
          soft:    "var(--cv-success-soft)",
          fg:      "var(--cv-success-fg)",
        },
        "cv-danger": {
          DEFAULT: "var(--cv-danger)",
          strong:  "var(--cv-danger-strong)",
          soft:    "var(--cv-danger-soft)",
          fg:      "var(--cv-danger-fg)",
        },
        "cv-neutral": {
          50:  "var(--cv-neutral-50)",
          100: "var(--cv-neutral-100)",
          200: "var(--cv-neutral-200)",
          300: "var(--cv-neutral-300)",
          400: "var(--cv-neutral-400)",
          500: "var(--cv-neutral-500)",
          600: "var(--cv-neutral-600)",
          700: "var(--cv-neutral-700)",
          800: "var(--cv-neutral-800)",
          900: "var(--cv-neutral-900)",
        },
      },
      fontFamily: {
        // Single Apple San Francisco system stack across the platform. Body,
        // display, and any direct `font-sans` / `font-display` class usage
        // resolve to the exact same font — SF on Apple platforms, native
        // fallbacks elsewhere. CSS var defined in app/globals.css.
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Helvetica Neue",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Helvetica Neue",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
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
      // modals 16. Never mix radii randomly within a component class.
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "16px",
        full: "9999px",
      },
      boxShadow: {
        // Single shadow level across the app — anything bigger reads as
        // decorative. Modals reuse this, no second tier.
        card: "var(--cv-shadow-card)",
        "card-hover": "var(--cv-shadow-card-hover)",
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
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "marquee-scroll": "marquee 40s linear infinite",
        "marquee-scroll-reverse": "marquee-reverse 40s linear infinite",
        "marquee-scroll-slow": "marquee 60s linear infinite",
        "marquee-scroll-reverse-slow": "marquee-reverse 60s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
