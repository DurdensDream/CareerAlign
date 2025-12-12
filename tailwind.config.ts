import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"]
      },
      colors: {
        brand: {
          deep: "#04121f",
          teal: "#0d5257",
          sand: "#f5f1eb"
        }
      },
      backgroundImage: {
        "glass-gradient": "linear-gradient(135deg, rgba(13,82,87,0.08), rgba(8,28,53,0.05))"
      },
      boxShadow: {
        glass: "0 40px 80px -35px rgba(4,18,31,0.35)"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" }
        }
      },
      animation: {
        shimmer: "shimmer 1.8s infinite"
      }
    }
  },
  plugins: []
};

export default config;
