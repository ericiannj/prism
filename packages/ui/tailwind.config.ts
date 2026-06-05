import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        "surface-elevated": "hsl(var(--surface-elevated))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        status: {
          processing: "hsl(var(--status-processing))",
          "processing-fg": "hsl(var(--status-processing-fg))",
          ready: "hsl(var(--status-ready))",
          "ready-fg": "hsl(var(--status-ready-fg))",
          error: "hsl(var(--status-error))",
          "error-fg": "hsl(var(--status-error-fg))",
        },
        source: {
          parametric: "hsl(var(--source-parametric))",
          "parametric-fg": "hsl(var(--source-parametric-fg))",
          document: "hsl(var(--source-document))",
          "document-fg": "hsl(var(--source-document-fg))",
          web: "hsl(var(--source-web))",
          "web-fg": "hsl(var(--source-web-fg))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
