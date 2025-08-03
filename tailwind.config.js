/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'glowPink': 'glowPink 2s ease-in-out infinite alternate',
        'glowRed': 'glowRed 2s ease-in-out infinite alternate',
        'glowMerge': 'glowMerge 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glowPink: {
          '0%': {
            filter: 'drop-shadow(0 0 8px rgba(255, 105, 180, 0.5))',
          },
          '100%': {
            filter: 'drop-shadow(0 0 20px rgba(255, 105, 180, 0.9)) drop-shadow(0 0 30px rgba(255, 105, 180, 0.6))',
          },
        },
        glowRed: {
          '0%': {
            filter: 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.5))',
          },
          '100%': {
            filter: 'drop-shadow(0 0 20px rgba(255, 0, 0, 0.9)) drop-shadow(0 0 30px rgba(255, 0, 0, 0.6))',
          },
        },
        glowMerge: {
          '0%': {
            filter: 'drop-shadow(0 0 12px rgba(139, 0, 0, 0.8)) hue-rotate(0deg)',
          },
          '50%': {
            filter: 'drop-shadow(0 0 25px rgba(255, 105, 180, 1)) hue-rotate(180deg)',
          },
          '100%': {
            filter: 'drop-shadow(0 0 20px rgba(255, 0, 0, 0.9)) hue-rotate(360deg)',
          },
        },
      },
      dropShadow: {
        'pink': '0 0 15px rgba(255, 105, 180, 0.6)',
        'red': '0 0 15px rgba(255, 0, 0, 0.6)',
        'darkRed': '0 0 20px rgba(139, 0, 0, 0.8)',
      },
    },
  },
  plugins: [],
}