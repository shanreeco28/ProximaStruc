/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // <--- THIS IS CRITICAL FOR DARK MODE TO WORK
  theme: {
    extend: {
      colors: {
      }
    },
  },
  plugins: [],
}