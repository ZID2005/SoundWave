import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-conic": "conic-gradient(var(--tw-gradient-stops))",
      },
      colors: {
        background: "#000000",
        foreground: "#F5F5F5",
        primary: "#C9A84C",
        secondary: "#A8A8A8",
        muted: "#6B6B6B",
        surface: "#141414",
        border: "#1F1F1F",
        card: "rgba(20, 20, 20, 0.9)",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        cormorant: ["Cormorant Garamond", "Georgia", "serif"],
        dm: ["DM Sans", "system-ui", "sans-serif"],
      },
      animation: {
        "soundwave": "soundwave 3s ease-in-out infinite",
        "grain": "grain 8s steps(10) infinite",
        "float-slow": "float 6s ease-in-out infinite",
        "star-btn": "star-btn calc(var(--duration) * 1s) linear infinite",
      },
      keyframes: {
        soundwave: {
          "0%, 100%": { d: "path('M0,50 Q100,20 200,50 Q300,80 400,50 Q500,20 600,50 Q700,80 800,50')" },
          "50%": { d: "path('M0,50 Q100,80 200,50 Q300,20 400,50 Q500,80 600,50 Q700,20 800,50')" },
        },
        grain: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-2%, -2%)" },
          "30%": { transform: "translate(3%, 1%)" },
          "50%": { transform: "translate(-1%, 3%)" },
          "70%": { transform: "translate(2%, -1%)" },
          "90%": { transform: "translate(-3%, 2%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
