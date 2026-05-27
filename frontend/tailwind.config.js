/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // blue-600
        primaryDark: '#1d4ed8', // blue-700
        primaryLight: '#60a5fa', // blue-400
      },
    },
  },
  plugins: [],
}
