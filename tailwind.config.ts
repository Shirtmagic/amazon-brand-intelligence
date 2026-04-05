import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        honey: {
          300: '#F6C1B8',
          400: '#F4A48A'
        },
        sand: {
          50: '#FDF9F5',
          100: '#F7F0EC'
        },
        cocoa: {
          500: '#2F1C18'
        },
        evergreen: '#108474',
        mint: '#449879',
        sunstone: '#E16F27'
      }
    }
  },
  plugins: []
};

export default config;
