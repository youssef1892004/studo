import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#1a73e8',
        'brand-gray': {
          50: '#f7f7f7',
          100: '#e5e5e5',
          200: '#cccccc',
          300: '#b2b2b2',
          400: '#999999',
          500: '#7f7f7f',
          600: '#666666',
          700: '#4c4c4c',
          800: '#333333',
          900: '#191919',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;