/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#1A6BBA",
        secondary: "#4FA3F7",
        "background-light": "#F8FAFC",
        "background-dark": "#0F172A",
        "surface-light": "#FFFFFF",
        "surface-dark": "#1E293B",
        "text-main-light": "#0F172A",
        "text-main-dark": "#F8FAFC",
        "text-muted-light": "#64748B",
        "text-muted-dark": "#94A3B8",
        "border-light": "#E2E8F0",
        "border-dark": "#334155"
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        'xl': "1rem"
      },
    },
  },
  plugins: [],
}
