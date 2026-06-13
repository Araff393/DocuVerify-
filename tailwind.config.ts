import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        /* Landing page accent */
        "landing-primary": "#8ff5ff",
        "landing-bg": "#080e1c",
        "landing-surface": "#0a1226",
        "landing-outline": "#424858",

        /* Internal pages */
        background: "#0d1321",
        surface: "#0d1321",
        "surface-container": "#1a1f2e",
        "surface-container-low": "#161b2a",
        "surface-container-high": "#242a39",
        "surface-container-highest": "#2f3444",
        "surface-container-lowest": "#080e1c",
        "surface-variant": "#2f3444",
        "surface-bright": "#333949",
        "on-background": "#dde2f6",
        "on-surface": "#dde2f6",
        "on-surface-variant": "#b9cacb",
        primary: "#dbfcff",
        "primary-container": "#00f0ff",
        "on-primary": "#00363a",
        "on-primary-fixed": "#002022",
        "on-primary-fixed-variant": "#004f54",
        "on-primary-container": "#006970",
        secondary: "#4edea3",
        "secondary-container": "#00a572",
        "secondary-fixed-dim": "#4edea3",
        "secondary-fixed": "#6ffbbe",
        "on-secondary": "#003824",
        "on-secondary-container": "#00311f",
        "on-secondary-fixed": "#002113",
        "on-secondary-fixed-variant": "#005236",
        outline: "#849495",
        "outline-variant": "#3b494b",
        error: "#ffb4ab",
        "error-container": "#93000a",
        "on-error": "#690005",
        "on-error-container": "#ffdad6",
        tertiary: "#fff3f2",
        "tertiary-container": "#ffcdcf",
        "tertiary-fixed": "#ffdadb",
        "tertiary-fixed-dim": "#ffb2b7",
        "on-tertiary": "#67001b",
        "on-tertiary-container": "#bc0b3b",
        "on-tertiary-fixed": "#40000d",
        "on-tertiary-fixed-variant": "#92002a",
        "inverse-surface": "#dde2f6",
        "inverse-on-surface": "#2b3040",
        "inverse-primary": "#006970",
        "surface-tint": "#00dbe9",
        "primary-fixed": "#7df4ff",
        "primary-fixed-dim": "#00dbe9",
        "surface-dim": "#0d1321"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px"
      },
      fontFamily: {
        headline: ["var(--font-syne)", "Syne", "sans-serif"],
        serif: ["var(--font-dm-serif)", "DM Serif Display", "serif"],
        body: ["var(--font-outfit)", "Outfit", "sans-serif"],
        label: ["var(--font-outfit)", "Outfit", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"]
      },
      boxShadow: {
        panel: "0 24px 60px rgba(0, 0, 0, 0.3)",
        glow: "0 0 15px rgba(0, 240, 255, 0.15)",
        "glow-lg": "0 0 30px rgba(0, 240, 255, 0.25)",
        "glow-green": "0 0 20px rgba(78, 222, 163, 0.2)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(0, 240, 255, 0.08), transparent 30%), radial-gradient(circle at bottom right, rgba(78, 222, 163, 0.06), transparent 24%)"
      }
    }
  },
  plugins: []
};

export default config;
