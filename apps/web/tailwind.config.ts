import type { Config } from 'tailwindcss';
import sharedConfig from '@soundstudio/ui/tailwind';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: [...(sharedConfig.plugins || [])]
};

export default config;
