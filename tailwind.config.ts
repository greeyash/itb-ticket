import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        copper: "#775537",
        butter: "#FBE29D",
        nebula: "#C0DDDA",
        seashell: "#F1F1F1",
        pale: "#FFFAE6",
        buttersoft: "#FFF1B5",
        saltywater: "#E8EFFA",
        ocean: "#013F62",
        "ocean-light": "#024d77",
        "ocean-dark": "#012a42",
        "copper-light": "#8a6342",
        "copper-dark": "#5e4029",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      boxShadow: {
        "ocean-sm": "0 2px 8px rgba(1, 63, 98, 0.15)",
        "ocean-md": "0 4px 20px rgba(1, 63, 98, 0.2)",
        "ocean-lg": "0 8px 40px rgba(1, 63, 98, 0.25)",
        "butter-sm": "0 2px 8px rgba(251, 226, 157, 0.4)",
        "butter-md": "0 4px 20px rgba(251, 226, 157, 0.5)",
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;