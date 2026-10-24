import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 5 Central Semantic Color Variables (With Alpha Channel Math)
        bg: {
          app: "rgb(var(--bg-app-rgb) / <alpha-value>)",
        },
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        text: {
          main: "rgb(var(--text-main-rgb) / <alpha-value>)",
          muted: "rgb(var(--text-muted-rgb) / <alpha-value>)",
        },
        brand: {
          DEFAULT: "rgb(var(--brand-primary-rgb) / <alpha-value>)",
          primary: "rgb(var(--brand-primary-rgb) / <alpha-value>)",
          hover: "var(--brand-hover)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          subtle: "rgb(var(--accent-subtle-rgb) / <alpha-value>)",
        },
        // Universal alias for 550+ border-theme usages in codebase
        theme: "rgb(var(--accent-rgb) / <alpha-value>)",

        // Mathematical Status System (Eye-friendly, low saturation)
        status: {
          success: "rgb(var(--status-success-rgb) / <alpha-value>)",
          warning: "rgb(var(--status-warning-rgb) / <alpha-value>)",
          danger: "rgb(var(--status-danger-rgb) / <alpha-value>)",
          info: "rgb(var(--status-info-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "'Plus Jakarta Sans'",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "'JetBrains Mono'",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        // Strict Boxy / low-radius design
        none: "0px",
        xs: "2px",
        sm: "4px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
