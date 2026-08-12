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
        gold: {
          light: '#F3E5AB',
          DEFAULT: '#D4AF37',
          dark: '#AA7C11',
          shadow: '#8C6207',
        },
        dark: {
          bg: '#0F0F0F',
          card: '#1A1A1A',
          border: '#2A2A2A',
          input: '#222222',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
        mono: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
