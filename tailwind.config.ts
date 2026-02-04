import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "sagar-amber": "#F2B34A",
        "sagar-saffron": "#E56A20",
        "sagar-rose": "#B43A28",
        "sagar-ink": "#2B140A",
        "sagar-sand": "#FFF1DD",
        "sagar-cream": "#FFF7EE",
        "sagar-gold": "#F6C85F",
        "sagar-ember": "#D44B2A",
        "sagar-crimson": "#8E1E1A"
      },
      fontFamily: {
        serif: ["var(--font-serif)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"]
      },
      boxShadow: {
        "sagar-card": "0 24px 48px -24px rgba(44, 26, 18, 0.45)",
        "sagar-soft": "0 20px 40px -30px rgba(44, 26, 18, 0.4)"
      }
    }
  },
  plugins: []
};
export default config;
