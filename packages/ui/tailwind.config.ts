import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(222.2 84% 4.9%)',
        foreground: 'hsl(210 40% 98%)',
        primary: {
          DEFAULT: 'hsl(221 83% 53%)',
          foreground: 'hsl(210 40% 98%)'
        },
        card: {
          DEFAULT: 'rgba(15, 23, 42, 0.8)',
          foreground: 'hsl(210 40% 98%)'
        },
        accent: {
          DEFAULT: 'hsl(210 40% 96%)',
          foreground: 'hsl(222.2 47.4% 11.2%)'
        },
        border: 'rgba(148, 163, 184, 0.2)'
      }
    }
  },
  plugins: []
};

export default config;
