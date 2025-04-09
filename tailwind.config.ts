import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "blue-france-sun-113": "#000091",
        gray: {
          100: "#F6F6F6",
          200: "#E5E5E5",
          300: "#DDDDDD",
          400: "#929292",
          500: "#666666",
          700: "#3A3A3A",
          900: "#161616",
        },
      },
    },
  },
  plugins: [],
};
export default config;
