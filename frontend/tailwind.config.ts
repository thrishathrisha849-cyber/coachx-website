import type { Config } from 'tailwindcss';

/**
 * Official CoachX brand tokens, extracted directly from the real logo
 * file (`public/images/coachx-logo.jpeg` — sampled pixel-by-pixel, not
 * eyeballed): `brand` (dark green, "Coach" wordmark) anchors its 600 step
 * at the exact logo green `#184E36`; `gold` (the "X") anchors its 500
 * step at the exact logo gold `#D2A230`. Both ramps are HSL-interpolated
 * around those anchors for the full 50–900 tint/shade range Tailwind
 * utilities expect. `gold` is an ACCENT only — premium/highlight/CTA
 * emphasis — never a background-fill color; `brand` remains the primary
 * color everywhere else (buttons, links, active nav, icons).
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5faf8',
          100: '#cae3d8',
          200: '#8fddba',
          300: '#5dcd9b',
          400: '#37b27b',
          500: '#278059',
          600: '#184e36',
          700: '#14412d',
          800: '#103424',
          900: '#0c271b',
        },
        gold: {
          50: '#faf9f4',
          100: '#ece5d4',
          200: '#ebd6a5',
          300: '#e3c57e',
          400: '#dab357',
          500: '#d2a230',
          600: '#a98225',
          700: '#7f611c',
          800: '#544112',
          900: '#2a2009',
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
