/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#17cfbf",
        "background-light": "#f6f8f8",
        "background-dark": "#112120",
      },
      fontFamily: {
        "display": ["Inter"]
      }
    },
  },
  plugins: [],
}