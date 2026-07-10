import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        fm: {
          bg: "rgb(var(--fm-bg) / <alpha-value>)",
          surface: "rgb(var(--fm-surface) / <alpha-value>)",
          accent: "rgb(var(--fm-accent) / <alpha-value>)",
          accent2: "rgb(var(--fm-accent2) / <alpha-value>)",
          text: "rgb(var(--fm-text) / <alpha-value>)",
          muted: "rgb(var(--fm-muted) / <alpha-value>)",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-in",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
