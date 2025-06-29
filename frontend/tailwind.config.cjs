/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      animation: {
        fadeZoomIn: 'fadeZoomIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeZoomIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), // sigue aquí si lo estás usando
    // ...otros plugins si tienes más
  ],
};