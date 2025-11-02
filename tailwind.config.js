/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#92408b',
        'primary-dark': '#7a3574',
        'primary-light': '#a85aa1',
      },
    },
  },
  plugins: [],
}

