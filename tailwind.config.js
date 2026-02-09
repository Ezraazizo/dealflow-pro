/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0f1117',
          card: '#181a22',
          elevated: '#1e2030',
          hover: '#252839',
        },
        border: {
          DEFAULT: '#2a2d3e',
          light: '#353849',
        },
        text: {
          DEFAULT: '#e4e5eb',
          secondary: '#8b8fa3',
          dim: '#5c5f73',
        },
        accent: {
          DEFAULT: '#f59e0b',
          hover: '#fbbf24',
          dim: 'rgba(245, 158, 11, 0.12)',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
