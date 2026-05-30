/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'noc-bg': '#06090f',
        'noc-bg2': '#0c111b',
        'noc-bg3': '#131a2b',
        'noc-surface': '#1a2236',
        'noc-border': '#1e2d4a',
        'noc-text1': '#e8edf5',
        'noc-text2': '#8b99b0',
        'noc-text3': '#556377',
        'noc-green': '#00d98b',
        'noc-green2': '#00b372',
        'noc-cyan': '#22d3ee',
        'noc-purple': '#a78bfa',
        'noc-rose': '#fb7185',
        'noc-amber': '#fbbf24',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        glass: '16px',
      },
    },
  },
  plugins: [],
}
