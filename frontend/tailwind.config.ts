import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 5 Central Semantic Color Variables
        bg: {
          app: "var(--bg-app)",
        },
        surface: "var(--surface)",
        text: {
          main: "var(--text-main)",
          muted: "var(--text-muted)",
        },
        brand: {
          primary: "var(--brand-primary)",
          hover: "var(--brand-hover)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          subtle: "var(--accent-subtle)",
        },
      },
      borderRadius: {
        // Boxy / low-radius design
        none: "0px",
        sm: "2px",
        DEFAULT: "4px",
        md: "4px",
        lg: "6px",
        xl: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
