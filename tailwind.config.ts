import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f1115',
        panel: '#171a21',
        panel2: '#1f232c',
        line: '#2a2f3a',
        muted: '#8b93a3',
        brand: '#4ade80',
        brandDim: '#22c55e',
        warn: '#f59e0b',
        danger: '#ef4444',
        accent: '#60a5fa',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
