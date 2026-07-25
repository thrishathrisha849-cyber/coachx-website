import type { Config } from 'tailwindcss';

/**
 * Shared design-token starting point for the member web app. Brand colors
 * are intentionally generic placeholders — real brand tokens are owned by
 * the design system and will replace these when the UI layer is built.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#8ecbff',
          400: '#59adff',
          500: '#3389ff',
          600: '#1c68f5',
          700: '#1552e1',
          800: '#1843b6',
          900: '#193c8f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};

export default config;
