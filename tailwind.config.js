/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hub-navy': '#0f2044',
        'hub-gold': '#D4A017',
        'hub-blue': '#1a3060',
      },
    },
  },
  plugins: [],
}
